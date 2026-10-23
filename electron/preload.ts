import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  openPrivateWindow: () => ipcRenderer.send('open-private-window'),
  showItemInFolder: (fullPath: string) => ipcRenderer.invoke('show-item-in-folder', fullPath),
  openPath: (fullPath: string) => ipcRenderer.invoke('open-path', fullPath),
  getDownloadsDir: () => ipcRenderer.invoke('get-downloads-dir'),
  getRecentDownloads: () => ipcRenderer.invoke('get-recent-downloads'),
  getChromeHistory: (limit?: number) => ipcRenderer.invoke('get-chrome-history', limit),
  getGoogleSuggestions: (query: string) => ipcRenderer.invoke('get-google-suggestions', query),
  onShortcut: (callback: (shortcut: string) => void) => {
    const handler = (_: any, shortcut: string) => callback(shortcut);
    ipcRenderer.on('trigger-shortcut', handler);
    return () => ipcRenderer.removeListener('trigger-shortcut', handler);
  },
  onPopupAsTab: (callback: (url: string) => void) => {
    const handler = (_: any, url: string) => callback(url);
    ipcRenderer.on('open-popup-as-tab', handler);
    return () => ipcRenderer.removeListener('open-popup-as-tab', handler);
  },
  onDownloadUpdated: (callback: (item: any) => void) => {
    const handler = (_: any, item: any) => callback(item);
    ipcRenderer.on('download-updated', handler);
    return () => ipcRenderer.removeListener('download-updated', handler);
  }
});
