import { contextBridge, ipcRenderer } from "electron";

/**
 * Preload para a janela de configuracoes.
 * Expoe API para gerenciamento de contas e preferencias.
 */
contextBridge.exposeInMainWorld("configAPI", {
  // Contas
  getAccounts: () => ipcRenderer.invoke("get-accounts"),
  addAccount: (name: string, emoji?: string) =>
    ipcRenderer.invoke("add-account", name, emoji),
  removeAccount: (id: string) => ipcRenderer.invoke("remove-account", id),
  renameAccount: (id: string, name: string) =>
    ipcRenderer.invoke("rename-account", id, name),
  setEmoji: (id: string, emoji: string) =>
    ipcRenderer.invoke("set-emoji", id, emoji),
  setTheme: (id: string, theme: string) =>
    ipcRenderer.invoke("set-theme", id, theme),

  // Auto-inicio
  getAutostart: () => ipcRenderer.invoke("get-autostart"),
  setAutostart: (enabled: boolean) =>
    ipcRenderer.invoke("set-autostart", enabled),

  // Modo nao perturbe
  getDnd: () => ipcRenderer.invoke("get-dnd"),
  setDnd: (enabled: boolean) => ipcRenderer.invoke("set-dnd", enabled),
  getDndSchedule: () => ipcRenderer.invoke("get-dnd-schedule"),
  setDndSchedule: (start: string, end: string) =>
    ipcRenderer.invoke("set-dnd-schedule", start, end),

  // Exportar/importar configuracoes
  exportConfig: () => ipcRenderer.invoke("export-config"),
  importConfig: () => ipcRenderer.invoke("import-config"),
});
