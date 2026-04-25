import { app, BrowserWindow, dialog, session } from "electron";
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

    // Intercepta downloads para mostrar dialog na frente da janela
    ses.on("will-download", (event, item) => {
      event.preventDefault();
      const filename = item.getFilename();
      const downloadsPath = app.getPath("downloads");
      const defaultPath = path.join(downloadsPath, filename);

      dialog
        .showSaveDialog(this.window, {
          title: "Salvar como",
          defaultPath,
          buttonLabel: "Salvar",
        })
        .then((result) => {
          if (result.canceled || !result.filePath) {
            item.cancel();
            return;
          }
          // Continua o download para o caminho escolhido
          const savePath = result.filePath;
          const url = item.getURL();
          ses.downloadURL(url);
          ses.once("will-download", (_e, newItem) => {
            newItem.setSavePath(savePath);
            newItem.on("done", (_event, state) => {
              if (state === "completed") {
                console.log(`[${this.account.name}] Download concluido: ${savePath}`);
              } else {
                console.log(`[${this.account.name}] Download falhou: ${state}`);
                try {
                  if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
                } catch {}
              }
            });
          });
        })
        .catch(() => {
          item.cancel();
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
