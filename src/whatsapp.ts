import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { transformDeepLink } from "./util"; // Função para transformar deep links
import ChromeVersionFix from "./fix/chrome-version-fix";
import Electron21Fix from "./fix/electron-21-fix";
import HotkeyModule from "./module/hotkey-module";
import ModuleManager from "./module/module-manager";
import TrayModule from "./module/tray-module";
import WindowSettingsModule from "./module/window-settings-module";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.9999.0 Safari/537.36";

/**
 * Classe principal que gerencia a aplicação WhatsApp Desktop.
 */
export default class WhatsApp {
  private readonly window: BrowserWindow;
  private readonly moduleManager: ModuleManager;
  public quitting = false;
  private readonly deepLinkUrl: string | null;

  constructor() {
    // Verifica se algum argumento passado inicia com "whatsapp://send" e transforma o deep link.
    this.deepLinkUrl = null;
    for (const arg of process.argv) {
      if (arg.startsWith("whatsapp://send")) {
        this.deepLinkUrl = transformDeepLink(arg);
        console.info("Deep link recebido:", this.deepLinkUrl);
        break;
      }
    }

    this.window = new BrowserWindow({
      title: "WhatsApp",
      width: 1100,
      height: 700,
      minWidth: 650,
      minHeight: 550,
      show: !process.argv.includes("--start-hidden"),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: false, // Necessário para sobrescrever Notification no preload
      },
    });

    this.moduleManager = new ModuleManager([
      new Electron21Fix(),
      new HotkeyModule(this, this.window),
      new TrayModule(this, this.window),
      new WindowSettingsModule(this, this.window),
      new ChromeVersionFix(this),
    ]);
  }

  /**
   * Inicializa a aplicação, configurando os módulos, eventos e carregando o WhatsApp Web.
   */
  public init() {
    this.makeLinksOpenInBrowser();
    this.registerListeners();

    this.moduleManager.beforeLoad();

    this.window.setMenu(null);
    // Se houver deep link, carrega a URL transformada; caso contrário, carrega a página padrão.
    const urlToLoad = this.deepLinkUrl
      ? this.deepLinkUrl
      : "https://web.whatsapp.com/";
    this.window.loadURL(urlToLoad, { userAgent: USER_AGENT });

    this.moduleManager.onLoad();
  }

  /**
   * Força o recarregamento do conteúdo.
   */
  public reload() {
    this.window.webContents.reloadIgnoringCache();
  }

  /**
   * Fecha a aplicação.
   */
  public quit() {
    this.quitting = true;
    this.moduleManager.onQuit();
    app.quit();
  }

  /**
   * Configura para que links externos sejam abertos no navegador padrão.
   */
  private makeLinksOpenInBrowser() {
    this.window.webContents.setWindowOpenHandler((details) => {
      if (details.url != this.window.webContents.getURL()) {
        shell.openExternal(details.url);
        return { action: "deny" };
      }
    });
  }

  /**
   * Registra os listeners para eventos globais da aplicação.
   */
  private registerListeners() {
    app.on("second-instance", () => {
      this.window.show();
      this.window.focus();
    });

    ipcMain.on("notification-click", () => this.window.show());
  }
}
