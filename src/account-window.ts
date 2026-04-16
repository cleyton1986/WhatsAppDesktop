import { BrowserWindow, ipcMain, session, Notification as ElectronNotification } from "electron";
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
      this.injectNotificationOverride();
      this.injectAudioMonitor();
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
    const accountName = this.account.name;
    this.window.webContents.executeJavaScript(`
      (function() {
        const OriginalNotification = window.Notification;
        const accountName = ${JSON.stringify(accountName)};
        window.Notification = class extends OriginalNotification {
          constructor(title, options) {
            const modifiedOptions = Object.assign({}, options);
            if (modifiedOptions.body) {
              modifiedOptions.body = '[' + accountName + '] ' + modifiedOptions.body;
            } else {
              modifiedOptions.body = '[' + accountName + ']';
            }
            super(title, modifiedOptions);
            // Envia dados da notificacao para o main process (resposta rapida)
            if (window.electronAPI && window.electronAPI.sendNotificationData) {
              window.electronAPI.sendNotificationData({ title: title, body: modifiedOptions.body });
            }
            this.addEventListener('click', () => {
              if (window.electronAPI && window.electronAPI.sendNotificationClick) {
                window.electronAPI.sendNotificationClick();
              }
            });
          }
        };
        window.Notification.permission = OriginalNotification.permission;
        window.Notification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);
      })();
    `);

    // Escuta dados de notificacao e cria notificacao nativa do Electron com acao de resposta
    const handler = (_event: any, data: { title: string; body: string }) => {
      if (!ElectronNotification.isSupported()) return;

      const notification = new ElectronNotification({
        title: data.title,
        body: data.body,
        hasReply: true,
        replyPlaceholder: "Responder...",
      });

      notification.on("click", () => {
        this.show();
      });

      notification.on("reply", (_event, reply) => {
        // Envia a resposta para o renderer para ser digitada no campo de mensagem
        this.window.webContents.executeJavaScript(`
          (function() {
            // Foca no campo de mensagem e insere o texto
            const input = document.querySelector('[contenteditable="true"][data-tab="10"]') ||
                          document.querySelector('[contenteditable="true"][role="textbox"]') ||
                          document.querySelector('footer [contenteditable="true"]');
            if (input) {
              input.focus();
              document.execCommand('insertText', false, ${JSON.stringify(reply)});
              // Simula Enter para enviar
              setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true });
                input.dispatchEvent(enterEvent);
              }, 100);
            }
          })();
        `);
      });

      notification.show();
    };

    // Remove handler anterior se existir e registra novo
    ipcMain.removeAllListeners("notification-data");
    ipcMain.on("notification-data", handler);
  }

  /**
   * Injeta monitor de audio que detecta quando um audio esta tocando
   * e envia o estado para o main process para o mini-player flutuante.
   */
  private injectAudioMonitor() {
    this.window.webContents.executeJavaScript(`
      (function() {
        let lastState = null;
        setInterval(() => {
          const audios = document.querySelectorAll('audio');
          let playing = null;
          audios.forEach(audio => {
            if (!audio.paused && audio.duration > 0) {
              playing = { playing: true, currentTime: audio.currentTime, duration: audio.duration };
            }
          });
          const state = playing || { playing: false, currentTime: 0, duration: 0 };
          const stateKey = state.playing + '-' + Math.floor(state.currentTime);
          if (stateKey !== lastState) {
            lastState = stateKey;
            if (window.electronAPI && window.electronAPI.sendAudioState) {
              window.electronAPI.sendAudioState(state);
            }
          }
        }, 1000);
      })();
    `);
  }
}
