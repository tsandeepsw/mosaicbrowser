 
import { contextBridge, ipcRenderer } from 'electron';

// Extremely narrow API surface.
contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  view: {
    create: (id: string, partitionId: string, url: string, bounds: any) => ipcRenderer.invoke('view:create', id, partitionId, url, bounds),
    destroy: (id: string) => ipcRenderer.invoke('view:destroy', id),
    background: (id: string) => ipcRenderer.invoke('view:background', id),
    setBounds: (id: string, bounds: any) => ipcRenderer.invoke('view:setBounds', id, bounds),
    setBoundsSync: (id: string, bounds: any) => ipcRenderer.send('view:setBoundsSync', id, bounds),
    navigate: (id: string, url: string) => ipcRenderer.invoke('view:navigate', id, url),
    goBack: (id: string) => ipcRenderer.invoke('view:goBack', id),
    goForward: (id: string) => ipcRenderer.invoke('view:goForward', id),
    reload: (id: string) => ipcRenderer.invoke('view:reload', id),
    focus: (id: string) => ipcRenderer.invoke('view:focus', id),
    setMuted: (id: string, isMuted: boolean) => ipcRenderer.invoke('view:setMuted', id, isMuted),
    onStateChanged: (callback: (state: any) => void) => {
      ipcRenderer.on('view:state-changed', (_event, state) => callback(state));
    }
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url)
  },
  storage: {
    getAllWorkspaces: () => ipcRenderer.invoke('storage:getAllWorkspaces'),
    saveWorkspace: (workspace: any) => ipcRenderer.invoke('storage:saveWorkspace', workspace),
    deleteWorkspace: (id: string) => ipcRenderer.invoke('storage:deleteWorkspace', id),
    getBookmarks: () => ipcRenderer.invoke('storage:getBookmarks'),
    saveBookmark: (id: string, url: string, title: string) => ipcRenderer.invoke('storage:saveBookmark', id, url, title),
    deleteBookmark: (id: string) => ipcRenderer.invoke('storage:deleteBookmark', id),
  },
  permission: {
    grant: (origin: string, permission: string) => ipcRenderer.invoke('permission:grant', origin, permission),
    deny: (origin: string, permission: string) => ipcRenderer.invoke('permission:deny', origin, permission),
  },
  notification: {
    getAll: () => ipcRenderer.invoke('notification:getAll'),
    clear: () => ipcRenderer.invoke('notification:clear'),
    onReceived: (callback: (notif: any) => void) => {
      ipcRenderer.on('notification-received', (_event, notif) => callback(notif));
    },
    onClicked: (callback: (notif: any) => void) => {
      ipcRenderer.on('notification-clicked', (_event, notif) => callback(notif));
    }
  },
  download: {
    getAll: () => ipcRenderer.invoke('download:getAll'),
    cancel: (id: string) => ipcRenderer.invoke('download:cancel', id),
    open: (id: string) => ipcRenderer.invoke('download:open', id),
    reveal: (id: string) => ipcRenderer.invoke('download:reveal', id),
    clearCompleted: () => ipcRenderer.invoke('download:clearCompleted'),
    onUpdated: (callback: (state: any) => void) => {
      ipcRenderer.on('download:updated', (_event, state) => callback(state));
    }
  },
  app: {
    onNavigate: (callback: (page: string) => void) => {
      ipcRenderer.on('app:navigate', (_event, page) => callback(page));
    },
    onNewWorkspace: (callback: () => void) => {
      ipcRenderer.on('app:new-workspace', () => callback());
    },
    onOpenUrlInNewPanel: (callback: (url: string) => void) => {
      ipcRenderer.on('app:open-url-in-new-panel', (_event, url) => callback(url));
    }
  }
});
