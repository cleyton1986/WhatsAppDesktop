import { contextBridge, ipcRenderer } from "electron";

/**
 * Expoe uma API segura para o renderer via contextBridge.
 * Com contextIsolation: true, o preload nao compartilha o mesmo contexto JS da pagina.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  sendNotificationClick: () => ipcRenderer.send("notification-click"),
  sendChromeVersionBug: () => ipcRenderer.send("chrome-version-bug"),
});
