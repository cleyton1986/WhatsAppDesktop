import { BrowserWindow } from "electron";
import path from "path";

let configWindow: BrowserWindow | null = null;

/**
 * Abre a janela de configuracoes (singleton).
 */
export function openConfigWindow() {
  if (configWindow && !configWindow.isDestroyed()) {
    configWindow.show();
    configWindow.focus();
    return;
  }

  configWindow = new BrowserWindow({
    title: "Configuracoes - WhatsApp Desktop",
    width: 600,
    height: 500,
    minWidth: 500,
    minHeight: 400,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-config.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });

  configWindow.setMenu(null);
  configWindow.loadFile(path.join(__dirname, "..", "data", "config.html"));

  configWindow.on("closed", () => {
    configWindow = null;
  });
}
