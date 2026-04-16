import { BrowserWindow } from "electron";
import Settings from "../settings";
import WhatsApp from "../whatsapp";
import Module from "./module";

const settings = new Settings("window");

/**
 * Módulo para salvar e restaurar as configurações de tamanho e posição da janela.
 */
export default class WindowSettingsModule extends Module {
  constructor(
    private readonly whatsApp: WhatsApp,
    private readonly window: BrowserWindow
  ) {
    super();
  }

  public override beforeLoad() {
    let defaults = this.window.getBounds(); // Obtém os valores padrão de tamanho e posição.
    this.window.setBounds(settings.get("bounds", defaults));

    if (settings.get("maximized", false)) {
      this.window.maximize();
    }
  }

  public override onQuit() {
    settings.set("maximized", this.window.isMaximized());

    if (!this.window.isMaximized()) {
      settings.set("bounds", this.window.getBounds());
    }
  }
}
