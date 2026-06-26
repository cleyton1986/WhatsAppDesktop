import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("pinAPI", {
  getData: () => ipcRenderer.invoke("pin-get-data"),
  submit: (pin: string) => ipcRenderer.invoke("pin-submit", pin),
  cancel: () => ipcRenderer.send("pin-cancel"),
});
