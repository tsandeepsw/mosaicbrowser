import { ipcMain, BrowserWindow } from 'electron';
import { WebContentsViewManager } from './managers/WebContentsViewManager';
import { NotificationManager } from './managers/NotificationManager';
import { PermissionManager } from './managers/PermissionManager';
import { DownloadManager } from './managers/DownloadManager';
import { ShellManager } from './managers/ShellManager';
import { BookmarkDropdownManager } from './managers/BookmarkDropdownManager';
import { z } from 'zod';

const BoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

// A safe regex for partition names (alphanumeric, dash, underscore)
const PartitionSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/);

const views = new Map<string, WebContentsViewManager>();

export function setupIPC(mainWindow: BrowserWindow) {
  NotificationManager.setup(mainWindow, views);
  DownloadManager.setup(mainWindow);

  ipcMain.handle('view:create', async (event, id: string, partitionId: string, url: string, bounds: Electron.Rectangle) => {
    z.string().parse(id);
    PartitionSchema.parse(partitionId);
    z.string().parse(url);
    BoundsSchema.parse(bounds);

    if (views.has(id)) {
      const view = views.get(id)!;
      if (view.partitionId !== partitionId) {
        view.destroy(mainWindow);
        views.delete(id);
      } else {
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

    const viewManager = new WebContentsViewManager(id, partitionId, (state) => {
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

  ipcMain.handle('view:destroy', (event, id: string) => {
    z.string().parse(id);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.destroy(mainWindow);
      views.delete(id);
    }
  });

  ipcMain.handle('view:background', (event, id: string) => {
    z.string().parse(id);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.setBackground(mainWindow, true);
    }
  });

  ipcMain.handle('view:setBounds', (event, id: string, bounds: Electron.Rectangle) => {
    z.string().parse(id);
    BoundsSchema.parse(bounds);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.setBounds(bounds);
    }
  });

  ipcMain.on('view:setBoundsSync', (event, id: string, bounds: Electron.Rectangle) => {
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.setBounds(bounds);
    }
  });

  ipcMain.handle('view:setVisible', (event, id: string, visible: boolean) => {
    z.string().parse(id);
    z.boolean().parse(visible);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.setVisible(visible);
    }
  });

  ipcMain.handle('view:setVisibleAll', (event, visible: boolean) => {
    z.boolean().parse(visible);
    views.forEach((viewManager) => {
      viewManager.setVisible(visible);
    });
  });

  ipcMain.handle('view:navigate', async (event, id: string, url: string) => {
    z.string().parse(id);
    z.string().parse(url);
    const viewManager = views.get(id);
    if (viewManager) {
      await viewManager.navigate(url).catch(console.error);
    }
  });

  ipcMain.handle('view:goBack', (event, id: string) => {
    z.string().parse(id);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.goBack();
    }
  });

  ipcMain.handle('view:goForward', (event, id: string) => {
    z.string().parse(id);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.goForward();
    }
  });

  ipcMain.handle('view:reload', (event, id: string) => {
    z.string().parse(id);
    const viewManager = views.get(id);
    if (viewManager) {
      viewManager.reload();
    }
  });

  ipcMain.handle('view:focus', (event, id: string) => {
    z.string().parse(id);
    const viewManager = views.get(id);
    if (viewManager) {
      // @ts-expect-error accessing private view
      viewManager.view?.webContents?.focus();
    }
  });

  ipcMain.handle('view:setMuted', (event, id: string, isMuted: boolean) => {
    z.string().parse(id);
    z.boolean().parse(isMuted);
    const viewManager = views.get(id);
    if (viewManager) {
      // @ts-expect-error accessing private view
      viewManager.view?.webContents?.setAudioMuted(isMuted);
    }
  });

  ipcMain.handle('shell:openExternal', async (event, url: string) => {
    z.string().parse(url);
    await ShellManager.openExternal(url);
  });

  const { SQLiteStorageProvider } = require('@workspacebrowser/storage');
  const path = require('path');
  const app = require('electron').app;
  const dbPath = path.join(app.getPath('userData'), 'workspace.db');
  const storage = new SQLiteStorageProvider(dbPath);
  storage.initialize();
  BookmarkDropdownManager.setup(mainWindow, storage);

  ipcMain.handle('storage:getAllWorkspaces', () => {
    return storage.getAllWorkspaces().data || [];
  });

  ipcMain.handle('storage:saveWorkspace', (event, workspace) => {
    storage.saveWorkspace(workspace);
  });

  ipcMain.handle('storage:deleteWorkspace', (event, id: string) => {
    z.string().parse(id);
    storage.deleteWorkspace(id);
  });

  ipcMain.handle('storage:getBookmarks', () => {
    return storage.getBookmarks().data || [];
  });

  ipcMain.handle('storage:saveBookmark', (event, id: string, url: string, title: string) => {
    z.string().parse(id);
    z.string().parse(url);
    z.string().parse(title);
    return storage.saveBookmark(id, url, title);
  });

  ipcMain.handle('storage:deleteBookmark', (event, id: string) => {
    z.string().parse(id);
    return storage.deleteBookmark(id);
  });

  ipcMain.handle('permission:grant', (event, origin: string, permission: string) => {
    z.string().parse(origin);
    z.string().parse(permission);
    PermissionManager.grant(origin, permission);
  });

  ipcMain.handle('permission:deny', (event, origin: string, permission: string) => {
    z.string().parse(origin);
    z.string().parse(permission);
    PermissionManager.deny(origin, permission);
  });
}
