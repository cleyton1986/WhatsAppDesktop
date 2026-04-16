import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("notifAPI", {
  reply: (accountId: string, contactName: string, text: string) =>
    ipcRenderer.send("notif-reply", accountId, contactName, text),
  silence: () => ipcRenderer.send("notif-silence"),
  hover: (hovering: boolean) => ipcRenderer.send("notif-hover", hovering),
  click: (accountId: string, contactName: string) =>
    ipcRenderer.send("notif-click", accountId, contactName),
});
