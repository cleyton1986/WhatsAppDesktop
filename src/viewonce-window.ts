import { BrowserWindow, screen } from "electron";
import path from "path";

let viewOnceWin: BrowserWindow | null = null;

function getDataPath(file: string): string {
  if (require("electron").app.isPackaged) {
    return path.join(process.resourcesPath, "..", "data", file);
  }
  return path.join(__dirname, "..", "data", file);
}

export function openViewOnceWindow(dataUrl: string, type: "image" | "video") {
  if (viewOnceWin && !viewOnceWin.isDestroyed()) {
    viewOnceWin.focus();
    viewOnceWin.webContents.send("viewonce-data", { dataUrl, type });
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const w = Math.min(900, Math.round(width * 0.75));
  const h = Math.min(700, Math.round(height * 0.8));

  viewOnceWin = new BrowserWindow({
    width: w,
    height: h,
    x: Math.round((width - w) / 2),
    y: Math.round((height - h) / 2),
    title: "Visualização única",
    backgroundColor: "#000",
    webPreferences: {
      preload: path.join(__dirname, "preload-viewonce.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });

  viewOnceWin.setMenu(null);
  viewOnceWin.loadFile(getDataPath("viewonce.html"));

  viewOnceWin.webContents.once("did-finish-load", () => {
    viewOnceWin?.webContents.send("viewonce-data", { dataUrl, type });
  });

  viewOnceWin.on("closed", () => {
    viewOnceWin = null;
  });
}
