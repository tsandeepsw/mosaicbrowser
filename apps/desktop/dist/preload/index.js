// src/preload/index.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => import_electron.ipcRenderer.invoke("ping"),
  view: {
    create: (id, partitionId, url, bounds) => import_electron.ipcRenderer.invoke("view:create", id, partitionId, url, bounds),
    destroy: (id) => import_electron.ipcRenderer.invoke("view:destroy", id),
    background: (id) => import_electron.ipcRenderer.invoke("view:background", id),
    setBounds: (id, bounds) => import_electron.ipcRenderer.invoke("view:setBounds", id, bounds),
    setBoundsSync: (id, bounds) => import_electron.ipcRenderer.send("view:setBoundsSync", id, bounds),
    navigate: (id, url) => import_electron.ipcRenderer.invoke("view:navigate", id, url),
    goBack: (id) => import_electron.ipcRenderer.invoke("view:goBack", id),
    goForward: (id) => import_electron.ipcRenderer.invoke("view:goForward", id),
    reload: (id) => import_electron.ipcRenderer.invoke("view:reload", id),
    focus: (id) => import_electron.ipcRenderer.invoke("view:focus", id),
    setMuted: (id, isMuted) => import_electron.ipcRenderer.invoke("view:setMuted", id, isMuted),
    onStateChanged: (callback) => {
      import_electron.ipcRenderer.on("view:state-changed", (_event, state) => callback(state));
    }
  },
  shell: {
    openExternal: (url) => import_electron.ipcRenderer.invoke("shell:openExternal", url)
  },
  storage: {
    getAllWorkspaces: () => import_electron.ipcRenderer.invoke("storage:getAllWorkspaces"),
    saveWorkspace: (workspace) => import_electron.ipcRenderer.invoke("storage:saveWorkspace", workspace),
    deleteWorkspace: (id) => import_electron.ipcRenderer.invoke("storage:deleteWorkspace", id),
    getBookmarks: () => import_electron.ipcRenderer.invoke("storage:getBookmarks"),
    saveBookmark: (id, url, title) => import_electron.ipcRenderer.invoke("storage:saveBookmark", id, url, title),
    deleteBookmark: (id) => import_electron.ipcRenderer.invoke("storage:deleteBookmark", id)
  },
  permission: {
    grant: (origin, permission) => import_electron.ipcRenderer.invoke("permission:grant", origin, permission),
    deny: (origin, permission) => import_electron.ipcRenderer.invoke("permission:deny", origin, permission)
  },
  notification: {
    getAll: () => import_electron.ipcRenderer.invoke("notification:getAll"),
    clear: () => import_electron.ipcRenderer.invoke("notification:clear"),
    onReceived: (callback) => {
      import_electron.ipcRenderer.on("notification-received", (_event, notif) => callback(notif));
    },
    onClicked: (callback) => {
      import_electron.ipcRenderer.on("notification-clicked", (_event, notif) => callback(notif));
    }
  },
  download: {
    getAll: () => import_electron.ipcRenderer.invoke("download:getAll"),
    cancel: (id) => import_electron.ipcRenderer.invoke("download:cancel", id),
    open: (id) => import_electron.ipcRenderer.invoke("download:open", id),
    reveal: (id) => import_electron.ipcRenderer.invoke("download:reveal", id),
    clearCompleted: () => import_electron.ipcRenderer.invoke("download:clearCompleted"),
    onUpdated: (callback) => {
      import_electron.ipcRenderer.on("download:updated", (_event, state) => callback(state));
    }
  },
  app: {
    onNavigate: (callback) => {
      import_electron.ipcRenderer.on("app:navigate", (_event, page) => callback(page));
    },
    onNewWorkspace: (callback) => {
      import_electron.ipcRenderer.on("app:new-workspace", () => callback());
    },
    onOpenUrlInNewPanel: (callback) => {
      import_electron.ipcRenderer.on("app:open-url-in-new-panel", (_event, url) => callback(url));
    }
  }
});
