"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupIPC = setupIPC;
const electron_1 = require("electron");
const WebContentsViewManager_1 = require("./managers/WebContentsViewManager");
const NotificationManager_1 = require("./managers/NotificationManager");
const PermissionManager_1 = require("./managers/PermissionManager");
const DownloadManager_1 = require("./managers/DownloadManager");
const ShellManager_1 = require("./managers/ShellManager");
const zod_1 = require("zod");
const BoundsSchema = zod_1.z.object({
    x: zod_1.z.number(),
    y: zod_1.z.number(),
    width: zod_1.z.number(),
    height: zod_1.z.number()
});
// A safe regex for partition names (alphanumeric, dash, underscore)
const PartitionSchema = zod_1.z.string().regex(/^[a-zA-Z0-9_-]+$/);
const views = new Map();
function setupIPC(mainWindow) {
    NotificationManager_1.NotificationManager.setup(mainWindow, views);
    DownloadManager_1.DownloadManager.setup(mainWindow);
    electron_1.ipcMain.handle('view:create', async (event, id, partitionId, url, bounds) => {
        zod_1.z.string().parse(id);
        PartitionSchema.parse(partitionId);
        zod_1.z.string().parse(url);
        BoundsSchema.parse(bounds);
        if (views.has(id)) {
            const view = views.get(id);
            if (view.partitionId !== partitionId) {
                view.destroy(mainWindow);
                views.delete(id);
            }
            else {
                if (view.isBackground) {
                    view.setBackground(mainWindow, false);
                }
                view.setBounds(bounds);
                if (view.state.url !== url && url) {
                    await view.navigate(url);
                }
                return;
            }
        }
        const viewManager = new WebContentsViewManager_1.WebContentsViewManager(id, partitionId, (state) => {
            if (!mainWindow.isDestroyed()) {
                mainWindow.webContents.send('view:state-changed', state);
            }
        });
        viewManager.create(mainWindow);
        viewManager.setBounds(bounds);
        views.set(id, viewManager);
        if (url) {
            await viewManager.navigate(url).catch(console.error);
        }
    });
    electron_1.ipcMain.handle('view:destroy', (event, id) => {
        zod_1.z.string().parse(id);
        const viewManager = views.get(id);
        if (viewManager) {
            viewManager.destroy(mainWindow);
            views.delete(id);
        }
    });
    electron_1.ipcMain.handle('view:background', (event, id) => {
        zod_1.z.string().parse(id);
        const viewManager = views.get(id);
        if (viewManager) {
            viewManager.setBackground(mainWindow, true);
        }
    });
    electron_1.ipcMain.handle('view:setBounds', (event, id, bounds) => {
        zod_1.z.string().parse(id);
        BoundsSchema.parse(bounds);
        const viewManager = views.get(id);
        if (viewManager) {
            viewManager.setBounds(bounds);
        }
    });
    electron_1.ipcMain.on('view:setBoundsSync', (event, id, bounds) => {
        const viewManager = views.get(id);
        if (viewManager) {
            viewManager.setBounds(bounds);
        }
    });
    electron_1.ipcMain.handle('view:navigate', async (event, id, url) => {
        zod_1.z.string().parse(id);
        zod_1.z.string().parse(url);
        const viewManager = views.get(id);
        if (viewManager) {
            await viewManager.navigate(url).catch(console.error);
        }
    });
    electron_1.ipcMain.handle('view:goBack', (event, id) => {
        zod_1.z.string().parse(id);
        const viewManager = views.get(id);
        // @ts-expect-error accessing private view
        if (viewManager?.view?.webContents?.navigationHistory.canGoBack()) {
            // @ts-expect-error accessing private view
            viewManager.view.webContents.navigationHistory.goBack();
        }
    });
    electron_1.ipcMain.handle('view:goForward', (event, id) => {
        zod_1.z.string().parse(id);
        const viewManager = views.get(id);
        // @ts-expect-error accessing private view
        if (viewManager?.view?.webContents?.navigationHistory.canGoForward()) {
            // @ts-expect-error accessing private view
            viewManager.view.webContents.navigationHistory.goForward();
        }
    });
    electron_1.ipcMain.handle('view:reload', (event, id) => {
        zod_1.z.string().parse(id);
        const viewManager = views.get(id);
        if (viewManager) {
            viewManager.reload();
        }
    });
    electron_1.ipcMain.handle('view:focus', (event, id) => {
        zod_1.z.string().parse(id);
        const viewManager = views.get(id);
        if (viewManager) {
            // @ts-expect-error accessing private view
            viewManager.view?.webContents?.focus();
        }
    });
    electron_1.ipcMain.handle('view:setMuted', (event, id, isMuted) => {
        zod_1.z.string().parse(id);
        zod_1.z.boolean().parse(isMuted);
        const viewManager = views.get(id);
        if (viewManager) {
            // @ts-expect-error accessing private view
            viewManager.view?.webContents?.setAudioMuted(isMuted);
        }
    });
    electron_1.ipcMain.handle('shell:openExternal', async (event, url) => {
        zod_1.z.string().parse(url);
        await ShellManager_1.ShellManager.openExternal(url);
    });
    const { SQLiteStorageProvider } = require('@workspacebrowser/storage');
    const path = require('path');
    const app = require('electron').app;
    const dbPath = path.join(app.getPath('userData'), 'workspace.db');
    const storage = new SQLiteStorageProvider(dbPath);
    storage.initialize();
    electron_1.ipcMain.handle('storage:getAllWorkspaces', () => {
        return storage.getAllWorkspaces().data || [];
    });
    electron_1.ipcMain.handle('storage:saveWorkspace', (event, workspace) => {
        storage.saveWorkspace(workspace);
    });
    electron_1.ipcMain.handle('storage:deleteWorkspace', (event, id) => {
        zod_1.z.string().parse(id);
        storage.deleteWorkspace(id);
    });
    electron_1.ipcMain.handle('permission:grant', (event, origin, permission) => {
        zod_1.z.string().parse(origin);
        zod_1.z.string().parse(permission);
        PermissionManager_1.PermissionManager.grant(origin, permission);
    });
    electron_1.ipcMain.handle('permission:deny', (event, origin, permission) => {
        zod_1.z.string().parse(origin);
        zod_1.z.string().parse(permission);
        PermissionManager_1.PermissionManager.deny(origin, permission);
    });
}
