import { BrowserWindow, Menu, MenuItem, Tray } from "electron";
import { findIcon, getUnreadMessages } from "../util";
import WhatsApp from "../whatsapp";
import Module from "./module";

// Atualize os nomes dos ícones para os novos nomes definidos
const ICON = findIcon("whatsapp-desktop-cleyton.png");
const ICON_UNREAD = findIcon("whatsapp-desktop-cleyton-unread.png");

/**
 * Módulo responsável por criar e gerenciar o ícone de tray.
 */
export default class TrayModule extends Module {
  private readonly tray: Tray;

  constructor(
    private readonly whatsApp: WhatsApp,
    private readonly window: BrowserWindow
  ) {
    super();
    console.log("[TrayModule] Criando instância de Tray com ícone:", ICON);
    this.tray = new Tray(ICON);
  }

  public override onLoad() {
    console.log("[TrayModule] onLoad chamado. Atualizando menu do tray...");
    this.updateMenu();
    this.registerListeners();
  }

  /**
   * Atualiza o menu do tray com as opções e o tooltip com base no número de mensagens não lidas.
   * @param unread Número de chats não lidos (padrão 0).
   */
  private updateMenu(unread: number = getUnreadMessages(this.window.title)) {
    console.log("[TrayModule] Atualizando menu do tray. unread =", unread);
    const menu = Menu.buildFromTemplate([
      {
        label: this.window.isVisible() ? "Minimize to tray" : "Show WhatsApp",
        click: () => this.onClickFirstItem(),
      },
      {
        label: "Quit WhatsApp",
        click: () => {
          console.log("[TrayModule] Quit selecionado.");
          this.whatsApp.quit();
        },
      },
    ]);

    let tooltip = "WhatsApp Desktop";

    if (unread != 0) {
      menu.insert(
        0,
        new MenuItem({
          label: `${unread} unread chats`,
          enabled: false,
        })
      );

      menu.insert(1, new MenuItem({ type: "separator" }));

      tooltip = `${tooltip} - ${unread} unread chats`;
    }

    this.tray.setContextMenu(menu);
    this.tray.setToolTip(tooltip);
    console.log("[TrayModule] Menu e tooltip atualizados.");
  }

  /**
   * Alterna entre mostrar e esconder a janela da aplicação.
   */
  private onClickFirstItem() {
    if (this.window.isVisible()) {
      console.log("[TrayModule] Janela visível, ocultando...");
      this.window.hide();
    } else {
      console.log("[TrayModule] Janela oculta, exibindo...");
      this.window.show();
      this.window.focus();
    }
    this.updateMenu();
  }

  /**
   * Registra os listeners para eventos da janela e do tray.
   */
  private registerListeners() {
    // Atualiza o menu sempre que a janela for mostrada ou escondida.
    this.window.on("show", () => {
      console.log("[TrayModule] Evento 'show' disparado.");
      this.updateMenu();
    });
    this.window.on("hide", () => {
      console.log("[TrayModule] Evento 'hide' disparado.");
      this.updateMenu();
    });

    // Intercepta o fechamento da janela para minimizá-la no tray.
    this.window.on("close", (event) => {
      console.log("[TrayModule] Evento 'close' disparado.");
      if (this.whatsApp.quitting) {
        console.log("[TrayModule] Aplicativo está sendo finalizado.");
        return;
      }
      event.preventDefault();
      console.log("[TrayModule] Prevenindo fechamento e ocultando janela.");
      this.window.hide();
    });

    // Atualiza o menu do tray quando o título da página for atualizado.
    this.window.webContents.on(
      "page-title-updated",
      (_event, title, explicitSet) => {
        if (!explicitSet) return;
        console.log("[TrayModule] Título atualizado para:", title);
        let unread = getUnreadMessages(title);
        this.updateMenu(unread);
        this.tray.setImage(unread == 0 ? ICON : ICON_UNREAD);
      }
    );
  }
}
