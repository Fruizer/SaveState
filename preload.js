const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openFolder: (folderPath) => ipcRenderer.invoke("open-folder", folderPath),
});