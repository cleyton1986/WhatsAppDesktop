import { app } from "electron";
import AppController from "./app-controller";
import { setupDesktopEntry } from "./setup-desktop-entry";

// Registra o protocolo whatsapp:// como handler nativo do Electron
app.setAsDefaultProtocolClient("whatsapp");

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit();
}

app.whenReady().then(() => {
  setupDesktopEntry();
  new AppController().init();
});

// Nao encerrar o app quando todas as janelas fecharem - o app vive no tray
app.on("window-all-closed", () => {
  // Nao faz nada - o app continua rodando na bandeja do sistema
});
