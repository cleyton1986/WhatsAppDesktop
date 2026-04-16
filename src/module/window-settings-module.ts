import { BrowserWindow } from "electron";
import Settings from "../settings";
import WhatsApp from "../whatsapp";
import Module from "./module";

/**
 * Modulo para salvar e restaurar as configuracoes de tamanho e posicao da janela.
 * Aceita um Settings injetado para suporte multi-conta (cada conta tem seu proprio scope).
 */
export default class WindowSettingsModule extends Module {
  private readonly settings: Settings;

  constructor(
    private readonly whatsApp: WhatsApp | { quitting: boolean; quit: () => void },
    private readonly window: BrowserWindow,
    settings?: Settings
  ) {
    super();
    this.settings = settings || new Settings("window");
  }

  public override beforeLoad() {
    const defaults = this.window.getBounds();
    this.window.setBounds(this.settings.get("bounds", defaults));

    if (this.settings.get("maximized", false)) {
      this.window.maximize();
    }
  }

  public override onQuit() {
    this.settings.set("maximized", this.window.isMaximized());

    if (!this.window.isMaximized()) {
      this.settings.set("bounds", this.window.getBounds());
    }
  }
}
