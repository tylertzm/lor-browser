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
  vaultArchiveTab: (payload: any) => ipcRenderer.invoke('vault:archive-tab', payload),
  vaultSearch: (query: string, limit?: number) => ipcRenderer.invoke('vault:search', query, limit),
  vaultList: (limit?: number) => ipcRenderer.invoke('vault:list', limit),
  vaultDelete: (id: string) => ipcRenderer.invoke('vault:delete', id),
  vaultStats: () => ipcRenderer.invoke('vault:stats'),
  getSystemSpecs: () => ipcRenderer.invoke('get-system-specs'),
  knowledgeSaveEntry: (entry: any) => ipcRenderer.invoke('knowledge:save-entry', entry),
  knowledgeLoadAll: () => ipcRenderer.invoke('knowledge:load-all'),
  knowledgeQuery: (query: string, category?: string) => ipcRenderer.invoke('knowledge:query', query, category),
  knowledgeDelete: (id: string) => ipcRenderer.invoke('knowledge:delete', id),
  workflowRun: (request: any) => ipcRenderer.invoke('workflow:run', request),
  googleCheckAuth: () => ipcRenderer.invoke('google:check-auth'),
  googleSignIn: () => ipcRenderer.invoke('google:sign-in'),
  googleDocWrite: (payload: { content: string; title?: string; docUrl?: string; html?: string }) => ipcRenderer.invoke('google:doc-write', payload),
  googleDocsMcp: (toolName: string, args: any) => ipcRenderer.invoke('google:docs-mcp', { toolName, args }),
  onGoogleAuthChanged: (callback: (data: { signedIn: boolean }) => void) => {
    const handler = (_: any, data: { signedIn: boolean }) => callback(data);
    ipcRenderer.on('google:auth-changed', handler);
    return () => ipcRenderer.removeListener('google:auth-changed', handler);
  },
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
  },
  pipOpen: (mediaInfo: any) => ipcRenderer.invoke('pip:open', mediaInfo),
  pipClose: () => ipcRenderer.invoke('pip:close'),
  pipUpdateMedia: (mediaInfo: any) => ipcRenderer.send('pip:update-media', mediaInfo),
  pipSendControl: (action: string, payload?: any) => ipcRenderer.send('pip:control', action, payload),
  pipBackToTab: (tabId: string) => ipcRenderer.send('pip:back-to-tab', tabId),
  pipSignal: (signal: any) => ipcRenderer.send('pip:signal', signal),
  onPiPControl: (callback: (data: { action: string; payload?: any }) => void) => {
    const handler = (_: any, data: { action: string; payload?: any }) => callback(data);
    ipcRenderer.on('pip:control-command', handler);
    return () => ipcRenderer.removeListener('pip:control-command', handler);
  },
  onPiPMediaUpdate: (callback: (mediaInfo: any) => void) => {
    const handler = (_: any, mediaInfo: any) => callback(mediaInfo);
    ipcRenderer.on('pip:media-update', handler);
    return () => ipcRenderer.removeListener('pip:media-update', handler);
  },
  onPiPSignal: (callback: (signal: any) => void) => {
    const handler = (_: any, signal: any) => callback(signal);
    ipcRenderer.on('pip:signal', handler);
    return () => ipcRenderer.removeListener('pip:signal', handler);
  },
  onWindowBlur: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('window-blur', handler);
    return () => ipcRenderer.removeListener('window-blur', handler);
  },
  onSelectTabFromMain: (callback: (tabId: string) => void) => {
    const handler = (_: any, tabId: string) => callback(tabId);
    ipcRenderer.on('select-tab-from-main', handler);
    return () => ipcRenderer.removeListener('select-tab-from-main', handler);
  }
});
