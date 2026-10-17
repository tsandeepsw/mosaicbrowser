"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Extremely narrow API surface.
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    ping: () => electron_1.ipcRenderer.invoke('ping'),
    view: {
        create: (id, partitionId, url, bounds) => electron_1.ipcRenderer.invoke('view:create', id, partitionId, url, bounds),
        destroy: (id) => electron_1.ipcRenderer.invoke('view:destroy', id),
        background: (id) => electron_1.ipcRenderer.invoke('view:background', id),
        setBounds: (id, bounds) => electron_1.ipcRenderer.invoke('view:setBounds', id, bounds),
        setBoundsSync: (id, bounds) => electron_1.ipcRenderer.send('view:setBoundsSync', id, bounds),
        navigate: (id, url) => electron_1.ipcRenderer.invoke('view:navigate', id, url),
        goBack: (id) => electron_1.ipcRenderer.invoke('view:goBack', id),
        goForward: (id) => electron_1.ipcRenderer.invoke('view:goForward', id),
        reload: (id) => electron_1.ipcRenderer.invoke('view:reload', id),
        focus: (id) => electron_1.ipcRenderer.invoke('view:focus', id),
        setMuted: (id, isMuted) => electron_1.ipcRenderer.invoke('view:setMuted', id, isMuted),
        onStateChanged: (callback) => {
            electron_1.ipcRenderer.on('view:state-changed', (_event, state) => callback(state));
        }
    },
    shell: {
        openExternal: (url) => electron_1.ipcRenderer.invoke('shell:openExternal', url)
    },
    storage: {
        getAllWorkspaces: () => electron_1.ipcRenderer.invoke('storage:getAllWorkspaces'),
        saveWorkspace: (workspace) => electron_1.ipcRenderer.invoke('storage:saveWorkspace', workspace),
        deleteWorkspace: (id) => electron_1.ipcRenderer.invoke('storage:deleteWorkspace', id),
    },
    permission: {
        grant: (origin, permission) => electron_1.ipcRenderer.invoke('permission:grant', origin, permission),
        deny: (origin, permission) => electron_1.ipcRenderer.invoke('permission:deny', origin, permission),
    },
    notification: {
        getAll: () => electron_1.ipcRenderer.invoke('notification:getAll'),
        clear: () => electron_1.ipcRenderer.invoke('notification:clear'),
        onReceived: (callback) => {
            electron_1.ipcRenderer.on('notification-received', (_event, notif) => callback(notif));
        },
        onClicked: (callback) => {
            electron_1.ipcRenderer.on('notification-clicked', (_event, notif) => callback(notif));
        }
    },
    download: {
        getAll: () => electron_1.ipcRenderer.invoke('download:getAll'),
        cancel: (id) => electron_1.ipcRenderer.invoke('download:cancel', id),
        open: (id) => electron_1.ipcRenderer.invoke('download:open', id),
        reveal: (id) => electron_1.ipcRenderer.invoke('download:reveal', id),
        clearCompleted: () => electron_1.ipcRenderer.invoke('download:clearCompleted'),
        onUpdated: (callback) => {
            electron_1.ipcRenderer.on('download:updated', (_event, state) => callback(state));
        }
    }
});
