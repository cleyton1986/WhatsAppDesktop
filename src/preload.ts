import { contextBridge, ipcRenderer } from "electron";

/**
 * Expoe uma API segura para o renderer via contextBridge.
 * Com contextIsolation: true, o preload nao compartilha o mesmo contexto JS da pagina.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  sendNotificationClick: () => ipcRenderer.send("notification-click"),
  sendChromeVersionBug: () => ipcRenderer.send("chrome-version-bug"),
  sendNotificationData: (data: { title: string; body: string }) =>
    ipcRenderer.send("notification-data", data),
  sendAudioState: (state: { playing: boolean; currentTime: number; duration: number }) =>
    ipcRenderer.send("audio-state", state),
  onQuickReply: (callback: (reply: string) => void) =>
    ipcRenderer.on("quick-reply", (_event, reply) => callback(reply)),
});
