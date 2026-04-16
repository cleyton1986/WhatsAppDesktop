import { ipcRenderer } from "electron";

/**
 * Sobrescreve o comportamento de Notification para adicionar log e enviar eventos via ipcRenderer.
 */
function overrideNotification() {
  console.log("overrideNotification() called.");
  window.Notification = class extends Notification {
    constructor(title: string, options: NotificationOptions) {
      console.log(
        "Notification constructor called with title:",
        title,
        "and options:",
        options
      );
      super(title, options);
      this.onclick = (_event) => {
        console.log(
          "Notification clicked. Sending 'notification-click' via ipcRenderer."
        );
        ipcRenderer.send("notification-click");
      };
    }
  };
}

/**
 * Corrige o bug da versão do Chrome detectado no WhatsApp Web.
 */
function handleChromeVersionBug() {
  console.log("handleChromeVersionBug() called.");
  window.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded event in handleChromeVersionBug.");
    if (
      document.getElementsByClassName("landing-title version-title").length !==
      0
    ) {
      console.log(
        "Chrome version bug detected. Sending 'chrome-version-bug' via ipcRenderer."
      );
      ipcRenderer.send("chrome-version-bug");
    }
  });
}

overrideNotification();
handleChromeVersionBug();
console.log("Preload script executed.");
