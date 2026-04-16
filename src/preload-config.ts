import { contextBridge, ipcRenderer } from "electron";

/**
 * Preload para a janela de configuracoes.
 * Expoe API para gerenciamento de contas.
 */
contextBridge.exposeInMainWorld("configAPI", {
  getAccounts: () => ipcRenderer.invoke("get-accounts"),
  addAccount: (name: string) => ipcRenderer.invoke("add-account", name),
  removeAccount: (id: string) => ipcRenderer.invoke("remove-account", id),
  renameAccount: (id: string, name: string) =>
    ipcRenderer.invoke("rename-account", id, name),
});
