import { app } from "electron";
import WhatsApp from "./whatsapp";
import { setupDesktopEntry } from "./setup-desktop-entry";

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit();
}

app.whenReady().then(() => {
  setupDesktopEntry();
  new WhatsApp().init();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
