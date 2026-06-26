import { BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import type AccountWindow from "./account-window";

let pinWindow: BrowserWindow | null = null;
let pendingAccountWindow: AccountWindow | null = null;

function getDataPath(file: string): string {
  if (require("electron").app.isPackaged) {
    return path.join(process.resourcesPath, "..", "data", file);
  }
  return path.join(__dirname, "..", "data", file);
}

/**
 * Abre a janela de PIN para desbloquear uma conta vault.
 * Se já houver uma janela aberta para outra conta, fecha e reabre.
 */
export function openPinWindow(aw: AccountWindow): void {
  if (pinWindow && !pinWindow.isDestroyed()) {
    pinWindow.focus();
    pendingAccountWindow = aw;
    return;
  }

  pendingAccountWindow = aw;

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const winW = 320;
  const winH = 280;

  pinWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: Math.round((width - winW) / 2),
    y: Math.round((height - winH) / 2),
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload-pin.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });

  pinWindow.setMenu(null);
  pinWindow.loadFile(getDataPath("pin.html"));

  pinWindow.on("closed", () => {
    pinWindow = null;
    pendingAccountWindow = null;
  });
}

/**
 * Registra os handlers IPC para a janela de PIN.
 * Deve ser chamado uma unica vez na inicializacao.
 */
export function registerPinHandlers(
  checkPin: (accountId: string, pin: string) => boolean
): void {
  ipcMain.handle("pin-get-data", () => {
    if (!pendingAccountWindow) return { accountName: "", pinLength: 4 };
    const { name, vault } = pendingAccountWindow.account;
    return { accountName: name, pinLength: vault?.pinLength ?? 4 };
  });

  ipcMain.handle("pin-submit", (_event, pin: string) => {
    if (!pendingAccountWindow) return false;
    const ok = checkPin(pendingAccountWindow.account.id, pin);
    if (ok) {
      const aw = pendingAccountWindow;
      pinWindow?.close();
      aw.show();
    }
    return ok;
  });

  ipcMain.on("pin-cancel", () => {
    pinWindow?.close();
  });
}
