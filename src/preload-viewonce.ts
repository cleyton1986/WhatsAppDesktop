import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("viewOnceAPI", {
  onData: (cb: (data: { dataUrl: string; type: string }) => void) =>
    ipcRenderer.on("viewonce-data", (_event, data) => cb(data)),
});
