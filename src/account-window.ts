import { app, BrowserWindow, session } from "electron";
import fs from "fs";
import path from "path";
import { Account } from "./account";
import { transformDeepLink } from "./util";
import HotkeyModule from "./module/hotkey-module";
import ModuleManager from "./module/module-manager";
import WindowSettingsModule from "./module/window-settings-module";
import Settings from "./settings";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/**
 * Gerencia uma janela BrowserWindow para uma conta WhatsApp.
 * Cada conta tem sua propria sessao isolada via partition.
 */
export default class AccountWindow {
  public readonly account: Account;
  public readonly window: BrowserWindow;
  private readonly moduleManager: ModuleManager;
  public quitting = false;
  public unreadCount = 0;

  // Callback para notificar o AppController sobre mudancas de unread
  public onUnreadChange?: (accountWindow: AccountWindow) => void;
  // Callback para verificar se o modo nao perturbe esta ativo
  public isDndActive?: () => boolean;

  constructor(account: Account) {
    this.account = account;

    this.window = new BrowserWindow({
      title: `WhatsApp - ${account.name}`,
      width: 1100,
      height: 700,
      minWidth: 650,
      minHeight: 550,
      show: !process.argv.includes("--start-hidden"),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        sandbox: true,
        partition: `persist:${account.id}`,
      },
    });

    // Usa settings scoped por conta
    const appController = { quitting: false, quit: () => this.quit() };

    this.moduleManager = new ModuleManager([
      new HotkeyModule(appController as any, this.window),
      new WindowSettingsModule(
        appController as any,
        this.window,
        new Settings(`${account.id}.window`)
      ),
    ]);
  }

  /**
   * Inicializa a janela, carrega o WhatsApp Web.
   */
  public init() {
    this.makeLinksOpenInBrowser();
    this.registerListeners();
    this.moduleManager.beforeLoad();
    this.window.setMenu(null);
    this.window.loadURL("https://web.whatsapp.com/", { userAgent: USER_AGENT });

    this.window.webContents.on("dom-ready", () => {
      console.log(`[${this.account.name}] dom-ready - injetando override de Notification`);
      this.injectNotificationOverride();
    });

    // Log TODAS as console-message para debug
    this.window.webContents.on("console-message", (_event, level, message) => {
      if (message.startsWith("__WA_NOTIF__")) {
        console.log(`[${this.account.name}] NOTIFICACAO CAPTURADA:`, message);
        try {
          const data = JSON.parse(message.substring("__WA_NOTIF__".length));
          const { pushNotification } = require("./notification-window");
          pushNotification(this.account.id, data.title, data.body, this.account.emoji || "");
        } catch (e) {
          console.error(`[${this.account.name}] Erro ao processar notificacao:`, e);
        }
      }
    });

    // Controla permissao de notificacao baseado no DnD
    const ses = session.fromPartition(`persist:${this.account.id}`);
    ses.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === "notifications") {
        const dndActive = this.isDndActive?.() ?? false;
        callback(!dndActive);
        return;
      }
      callback(true);
    });

    // Settings global compartilhado entre contas para ultimo diretorio usado
    const downloadSettings = new Settings("downloads");

    // Sugere nome com data/hora atual e abre no ultimo diretorio usado
    ses.on("will-download", (_event, item) => {
      const filename = item.getFilename();
      const ext = path.extname(filename);

      // Recupera ultimo diretorio usado, ou Downloads como padrao
      const lastDir = downloadSettings.get("lastDir", app.getPath("downloads")) as string;
      const targetDir = fs.existsSync(lastDir) ? lastDir : app.getPath("downloads");

      // Gera timestamp atual no formato YYYY-MM-DD at HH.MM.SS
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const dateStr =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        ` at ${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;

      // Detecta o tipo pelo nome original ou pela extensao
      let prefix = "WhatsApp File";
      if (/^WhatsApp\s+(Image|Video|Audio|Document|Ptt)/i.test(filename)) {
        const match = filename.match(/^(WhatsApp\s+\w+)/i);
        if (match) prefix = match[1];
      } else if (/\.(jpe?g|png|gif|webp|heic)$/i.test(ext)) {
        prefix = "WhatsApp Image";
      } else if (/\.(mp4|mov|webm|mkv|avi)$/i.test(ext)) {
        prefix = "WhatsApp Video";
      } else if (/\.(mp3|ogg|m4a|wav|opus)$/i.test(ext)) {
        prefix = "WhatsApp Audio";
      } else if (/\.(pdf|docx?|xlsx?|pptx?|txt|zip)$/i.test(ext)) {
        prefix = "WhatsApp Document";
      }

      let finalName = `${prefix} ${dateStr}${ext}`;

      // Se mesmo assim ja existir, adiciona contador
      let counter = 1;
      while (fs.existsSync(path.join(targetDir, finalName))) {
        finalName = `${prefix} ${dateStr} (${counter})${ext}`;
        counter++;
      }

      item.setSaveDialogOptions({
        defaultPath: path.join(targetDir, finalName),
      });

      // Memoriza o diretorio escolhido apos o download concluir
      item.once("done", (_e, state) => {
        if (state === "completed") {
          const savedPath = item.getSavePath();
          if (savedPath) {
            downloadSettings.set("lastDir", path.dirname(savedPath));
          }
        }
      });
    });


    this.moduleManager.onLoad();
  }

  /**
   * Navega para um deep link.
   */
  public navigateToDeepLink(url: string) {
    const transformedUrl = transformDeepLink(url);
    this.window.loadURL(transformedUrl, { userAgent: USER_AGENT });
  }

  /**
   * Mostra e foca a janela.
   */
  public show() {
    this.window.show();
    this.window.focus();
  }

  /**
   * Esconde a janela.
   */
  public hide() {
    this.window.hide();
  }

  /**
   * Recarrega a pagina.
   */
  public reload() {
    this.window.webContents.reloadIgnoringCache();
  }

  /**
   * Marca como saindo e executa onQuit dos modulos.
   */
  public quit() {
    this.quitting = true;
    this.moduleManager.onQuit();
  }

  private makeLinksOpenInBrowser() {
    const { shell } = require("electron");
    this.window.webContents.setWindowOpenHandler((details: any) => {
      if (details.url != this.window.webContents.getURL()) {
        shell.openExternal(details.url);
        return { action: "deny" as const };
      }
    });
  }

  private registerListeners() {
    // Intercepta fechamento para esconder em vez de fechar
    this.window.on("close", (event) => {
      if (this.quitting) return;
      event.preventDefault();
      this.window.hide();
    });

    // Rastreia mensagens nao lidas pelo titulo da pagina
    this.window.webContents.on(
      "page-title-updated",
      (_event, title, explicitSet) => {
        if (!explicitSet) return;
        const matches = title.match(/\(\d+\) WhatsApp/);
        this.unreadCount =
          matches == null
            ? 0
            : Number.parseInt(matches[0].match(/\d+/)![0]);
        this.onUnreadChange?.(this);
      }
    );
  }

  private injectNotificationOverride() {
    const accountEmoji = this.account.emoji || "";
    const accountName = this.account.name;
    const accountLabel = accountEmoji ? `${accountEmoji} ${accountName}` : accountName;

    // Substitui Notification completamente - usa console.log com prefixo especial
    // para comunicar com o main process (unica forma confiavel com contextIsolation + sandbox)
    this.window.webContents.executeJavaScript(`
      (function() {
        var label = ${JSON.stringify(accountLabel)};
        console.log('__WA_INJECT_OK__ label=' + label);
        function FakeNotification(title, options) {
          var opts = options || {};
          var body = opts.body ? '[' + label + '] ' + opts.body : '[' + label + ']';
          console.log('__WA_NOTIF__' + JSON.stringify({ title: title, body: body }));
        }
        FakeNotification.permission = 'granted';
        FakeNotification.requestPermission = function(cb) {
          if (cb) cb('granted');
          return Promise.resolve('granted');
        };
        window.Notification = FakeNotification;
      })();
    `).then(() => {
      console.log('[' + this.account.name + '] Inject executado com sucesso');
    }).catch((e: any) => {
      console.error('[' + this.account.name + '] Erro no inject:', e);
    });
  }
}
