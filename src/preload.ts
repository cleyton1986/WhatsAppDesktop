import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  sendNotificationClick: () => ipcRenderer.send("notification-click"),
});
