import { app, ipcMain } from "electron";
import AccountManager, { Account } from "./account";
import AccountWindow from "./account-window";
import TrayModule from "./module/tray-module";

/**
 * Controlador principal da aplicacao.
 * Gerencia multiplas contas WhatsApp, cada uma com sua propria janela e sessao.
 */
export default class AppController {
  public readonly accountManager: AccountManager;
  private readonly accountWindows = new Map<string, AccountWindow>();
  private trayModule!: TrayModule;
  public quitting = false;

  constructor() {
    this.accountManager = new AccountManager();
  }

  /**
   * Inicializa a aplicacao: cria janelas para todas as contas e configura o tray.
   */
  public init() {
    const accounts = this.accountManager.ensureDefaultAccount();

    // Cria uma janela para cada conta
    for (const account of accounts) {
      this.createAccountWindow(account);
    }

    // Configura o tray (singleton)
    this.trayModule = new TrayModule(this);
    this.trayModule.onLoad();

    this.registerListeners();
    this.registerIpcHandlers();
  }

  /**
   * Cria e inicializa uma janela para uma conta.
   */
  public createAccountWindow(account: Account): AccountWindow {
    const accountWindow = new AccountWindow(account);

    accountWindow.onUnreadChange = () => {
      this.trayModule.updateFromAccounts();
    };

    accountWindow.init();
    this.accountWindows.set(account.id, accountWindow);
    return accountWindow;
  }

  /**
   * Remove uma conta e fecha sua janela.
   */
  public removeAccountWindow(id: string) {
    const accountWindow = this.accountWindows.get(id);
    if (accountWindow) {
      accountWindow.quitting = true;
      accountWindow.window.destroy();
      this.accountWindows.delete(id);
    }
    this.accountManager.removeAccount(id);
    this.trayModule.updateFromAccounts();
  }

  /**
   * Retorna todas as janelas de conta ativas.
   */
  public getAccountWindows(): AccountWindow[] {
    return Array.from(this.accountWindows.values());
  }

  /**
   * Retorna uma janela de conta pelo ID.
   */
  public getAccountWindow(id: string): AccountWindow | undefined {
    return this.accountWindows.get(id);
  }

  /**
   * Retorna o total de mensagens nao lidas de todas as contas.
   */
  public getTotalUnread(): number {
    let total = 0;
    for (const aw of this.accountWindows.values()) {
      total += aw.unreadCount;
    }
    return total;
  }

  /**
   * Encerra a aplicacao.
   */
  public quit() {
    this.quitting = true;
    for (const aw of this.accountWindows.values()) {
      aw.quit();
    }
    app.quit();
  }

  private registerListeners() {
    app.on("second-instance", (_event, argv) => {
      // Procura deep link nos argumentos
      const deepLink = argv.find((arg) => arg.startsWith("whatsapp://"));

      // Usa a primeira conta (padrao) para deep links
      const firstWindow = this.getAccountWindows()[0];
      if (!firstWindow) return;

      if (deepLink) {
        console.info("Deep link recebido via second-instance:", deepLink);
        firstWindow.navigateToDeepLink(deepLink);
      }

      firstWindow.show();
    });

    ipcMain.on("notification-click", () => {
      // Mostra a primeira janela visivel ou a primeira conta
      const visible = this.getAccountWindows().find((aw) =>
        aw.window.isVisible()
      );
      if (visible) {
        visible.show();
      } else {
        const first = this.getAccountWindows()[0];
        first?.show();
      }
    });
  }

  /**
   * Registra handlers IPC para a tela de configuracoes.
   */
  private registerIpcHandlers() {
    ipcMain.handle("get-accounts", () => {
      return this.accountManager.getAccounts();
    });

    ipcMain.handle("add-account", (_event, name: string) => {
      const account = this.accountManager.addAccount(name);
      this.createAccountWindow(account);
      this.trayModule.updateFromAccounts();
      return account;
    });

    ipcMain.handle("remove-account", (_event, id: string) => {
      this.removeAccountWindow(id);
      // Se nao sobrou nenhuma conta, cria uma padrao
      if (this.accountManager.getAccounts().length === 0) {
        const account = this.accountManager.addAccount("WhatsApp");
        this.createAccountWindow(account);
      }
      return this.accountManager.getAccounts();
    });

    ipcMain.handle("rename-account", (_event, id: string, name: string) => {
      this.accountManager.renameAccount(id, name);
      const aw = this.accountWindows.get(id);
      if (aw) {
        aw.window.setTitle(`WhatsApp - ${name}`);
      }
      this.trayModule.updateFromAccounts();
      return this.accountManager.getAccounts();
    });
  }
}
