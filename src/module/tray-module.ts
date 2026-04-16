import { Menu, MenuItem, Tray } from "electron";
import { findIcon } from "../util";
import type AppController from "../app-controller";

const ICON = findIcon("whatsapp-desktop-cleyton.png");
const ICON_UNREAD = findIcon("whatsapp-desktop-cleyton-unread.png");

/**
 * Modulo responsavel pelo icone na bandeja do sistema.
 * Gerencia um unico tray icon para todas as contas.
 */
export default class TrayModule {
  private readonly tray: Tray;

  constructor(private readonly controller: AppController) {
    this.tray = new Tray(ICON);
  }

  public onLoad() {
    this.updateFromAccounts();
    this.registerTrayClick();
  }

  /**
   * Atualiza o menu e icone do tray com base em todas as contas.
   */
  public updateFromAccounts() {
    const accountWindows = this.controller.getAccountWindows();
    const totalUnread = this.controller.getTotalUnread();

    const menuItems: Electron.MenuItemConstructorOptions[] = [];

    // Se ha mensagens nao lidas, mostra contador no topo
    if (totalUnread > 0) {
      menuItems.push({
        label: `${totalUnread} mensagens nao lidas`,
        enabled: false,
      });
      menuItems.push({ type: "separator" });
    }

    // Lista cada conta com indicador de status
    for (const aw of accountWindows) {
      const isVisible = aw.window.isVisible();
      const statusIcon = aw.unreadCount > 0 ? "\uD83D\uDD34" : isVisible ? "\uD83D\uDFE2" : "\u26AA";
      const unreadLabel =
        aw.unreadCount > 0 ? ` (${aw.unreadCount})` : "";
      menuItems.push({
        label: `${statusIcon} ${aw.account.name}${unreadLabel}`,
        click: () => aw.show(),
      });
    }

    menuItems.push({ type: "separator" });

    menuItems.push({
      label: "Configuracoes",
      click: () => this.openConfig(),
    });

    menuItems.push({ type: "separator" });

    menuItems.push({
      label: "Fechar",
      click: () => this.controller.quit(),
    });

    const menu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(menu);

    // Tooltip
    let tooltip = "WhatsApp Desktop";
    if (totalUnread > 0) {
      tooltip += ` - ${totalUnread} mensagens nao lidas`;
    }
    this.tray.setToolTip(tooltip);

    // Icone: muda se qualquer conta tem mensagens nao lidas
    this.tray.setImage(totalUnread > 0 ? ICON_UNREAD : ICON);
  }

  /**
   * Clique no icone do tray alterna visibilidade da primeira janela.
   */
  private registerTrayClick() {
    this.tray.on("click", () => {
      const windows = this.controller.getAccountWindows();
      if (windows.length === 0) return;

      // Se alguma janela esta visivel, esconde todas
      const anyVisible = windows.some((aw) => aw.window.isVisible());
      if (anyVisible) {
        windows.forEach((aw) => aw.hide());
      } else {
        // Mostra todas as janelas
        windows.forEach((aw) => aw.show());
      }
    });
  }

  /**
   * Abre a janela de configuracoes.
   */
  private openConfig() {
    // Importa dinamicamente para evitar dependencia circular
    const { openConfigWindow } = require("../config-window");
    openConfigWindow();
  }
}
