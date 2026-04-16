import { app, globalShortcut, ipcMain } from "electron";
import AccountManager, { Account } from "./account";
import AccountWindow from "./account-window";
import Settings from "./settings";
import TrayModule from "./module/tray-module";
import { initMiniPlayer } from "./mini-player";

/**
 * Controlador principal da aplicacao.
 * Gerencia multiplas contas WhatsApp, cada uma com sua propria janela e sessao.
 */
export default class AppController {
  public readonly accountManager: AccountManager;
  public readonly settings = new Settings("app");
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
    this.registerGlobalShortcuts();
    initMiniPlayer();
  }

  /**
   * Cria e inicializa uma janela para uma conta.
   */
  public createAccountWindow(account: Account): AccountWindow {
    const accountWindow = new AccountWindow(account);

    accountWindow.onUnreadChange = () => {
      this.trayModule.updateFromAccounts();
      this.updateBadgeCount();
    };

    accountWindow.isDndActive = () => this.isDndActive();

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
   * Verifica se o modo nao perturbe esta ativo (manual ou por horario).
   */
  public isDndActive(): boolean {
    const enabled = this.settings.get("dnd.enabled", false);
    if (enabled) return true;

    const useSchedule = this.settings.get("dnd.useSchedule", false);
    if (!useSchedule) return false;

    const start = this.settings.get("dnd.start", "22:00");
    const end = this.settings.get("dnd.end", "07:00");

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Horario cruza meia-noite (ex: 22:00 - 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Registra atalhos globais Ctrl+1..9 para alternar entre contas.
   */
  private registerGlobalShortcuts() {
    for (let i = 1; i <= 9; i++) {
      globalShortcut.register(`CommandOrControl+${i}`, () => {
        const windows = this.getAccountWindows();
        const index = i - 1;
        if (index < windows.length) {
          windows[index].show();
        }
      });
    }

    app.on("will-quit", () => {
      globalShortcut.unregisterAll();
    });
  }

  /**
   * Atualiza o badge counter no dock/taskbar com total de mensagens nao lidas.
   */
  private updateBadgeCount() {
    const total = this.getTotalUnread();
    app.setBadgeCount(total);
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

    // Auto-inicio com o sistema
    ipcMain.handle("get-autostart", () => {
      return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle("set-autostart", (_event, enabled: boolean) => {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        args: ["--start-hidden"],
      });
      return app.getLoginItemSettings().openAtLogin;
    });

    // Modo nao perturbe
    ipcMain.handle("get-dnd", () => {
      return this.settings.get("dnd.enabled", false);
    });

    ipcMain.handle("set-dnd", (_event, enabled: boolean) => {
      this.settings.set("dnd.enabled", enabled);
      return enabled;
    });

    ipcMain.handle("get-dnd-schedule", () => {
      return {
        start: this.settings.get("dnd.start", "22:00"),
        end: this.settings.get("dnd.end", "07:00"),
        useSchedule: this.settings.get("dnd.useSchedule", false),
      };
    });

    ipcMain.handle(
      "set-dnd-schedule",
      (_event, start: string, end: string) => {
        this.settings.set("dnd.start", start);
        this.settings.set("dnd.end", end);
        this.settings.set("dnd.useSchedule", true);
        return { start, end, useSchedule: true };
      }
    );

    // Exportar/importar configuracoes
    ipcMain.handle("export-config", async () => {
      const { dialog } = require("electron");
      const result = await dialog.showSaveDialog({
        title: "Exportar configuracoes",
        defaultPath: "whatsapp-desktop-config.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!result.canceled && result.filePath) {
        const fs = require("fs");
        const config = {
          accounts: this.accountManager.getAccounts(),
          dnd: {
            enabled: this.settings.get("dnd.enabled", false),
            start: this.settings.get("dnd.start", "22:00"),
            end: this.settings.get("dnd.end", "07:00"),
            useSchedule: this.settings.get("dnd.useSchedule", false),
          },
          autostart: app.getLoginItemSettings().openAtLogin,
        };
        fs.writeFileSync(result.filePath, JSON.stringify(config, null, 2));
        return true;
      }
      return false;
    });

    ipcMain.handle("import-config", async () => {
      const { dialog } = require("electron");
      const result = await dialog.showOpenDialog({
        title: "Importar configuracoes",
        filters: [{ name: "JSON", extensions: ["json"] }],
        properties: ["openFile"],
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const fs = require("fs");
        try {
          const data = JSON.parse(
            fs.readFileSync(result.filePaths[0], "utf-8")
          );
          // Importar contas (apenas as que nao existem)
          if (data.accounts && Array.isArray(data.accounts)) {
            const existing = this.accountManager.getAccounts();
            for (const acc of data.accounts) {
              if (!existing.find((e: any) => e.name === acc.name)) {
                const newAcc = this.accountManager.addAccount(acc.name);
                this.createAccountWindow(newAcc);
              }
            }
          }
          // Importar DnD
          if (data.dnd) {
            this.settings.set("dnd.enabled", data.dnd.enabled || false);
            this.settings.set("dnd.start", data.dnd.start || "22:00");
            this.settings.set("dnd.end", data.dnd.end || "07:00");
            this.settings.set(
              "dnd.useSchedule",
              data.dnd.useSchedule || false
            );
          }
          // Importar autostart
          if (data.autostart !== undefined) {
            app.setLoginItemSettings({
              openAtLogin: data.autostart,
              args: ["--start-hidden"],
            });
          }
          this.trayModule.updateFromAccounts();
          return true;
        } catch (e) {
          console.error("Erro ao importar configuracoes:", e);
          return false;
        }
      }
      return false;
    });
  }
}
