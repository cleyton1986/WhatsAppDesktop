import { BrowserWindow, app } from "electron";
import path from "path";

let configWindow: BrowserWindow | null = null;

/**
 * Resolve o caminho para arquivos na pasta data/.
 * Em dev: ./data/ relativo ao projeto
 * Em producao (AppImage): extraFiles ficam na raiz do AppImage, ao lado de resources/
 */
function getDataPath(file: string): string {
  if (app.isPackaged) {
    // extraFiles no electron-builder ficam na raiz do app (ao lado de resources/)
    return path.join(process.resourcesPath, "..", "data", file);
  }
  return path.join(__dirname, "..", "data", file);
}

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
  configWindow.loadFile(getDataPath("config.html"));

  configWindow.on("closed", () => {
    configWindow = null;
  });
}
