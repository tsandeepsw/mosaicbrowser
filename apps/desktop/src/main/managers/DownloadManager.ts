import { ipcMain, BrowserWindow, DownloadItem, Event, app, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadState {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  savePath?: string;
}

export class DownloadManager {
  private static downloads = new Map<string, DownloadState>();
  private static activeItems = new Map<string, DownloadItem>();
  private static mainWindow: BrowserWindow | null = null;
  
  private static _defaultDownloadDir: string | null = null;
  
  private static get defaultDownloadDir(): string {
    if (!this._defaultDownloadDir) {
      try {
        this._defaultDownloadDir = app.getPath('downloads');
      } catch {
        this._defaultDownloadDir = '/fake/downloads';
      }
    }
    return this._defaultDownloadDir;
  }

  public static setup(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;

    ipcMain.handle('download:getAll', () => Array.from(this.downloads.values()));
    
    ipcMain.handle('download:cancel', (event, id: string) => {
      const item = this.activeItems.get(id);
      if (item) {
        item.cancel();
      }
    });

    ipcMain.handle('download:open', async (event, id: string) => {
      const state = this.downloads.get(id);
      if (state?.savePath && state.state === 'completed') {
        shell.openPath(state.savePath);
      }
    });

    ipcMain.handle('download:reveal', (event, id: string) => {
      const state = this.downloads.get(id);
      if (state?.savePath && state.state === 'completed') {
        shell.showItemInFolder(state.savePath);
      }
    });

    ipcMain.handle('download:clearCompleted', () => {
      for (const [id, state] of this.downloads.entries()) {
        if (state.state === 'completed' || state.state === 'cancelled' || state.state === 'interrupted') {
          this.downloads.delete(id);
        }
      }
    });
  }

  public static handleWillDownload(event: Event, item: DownloadItem) {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    this.activeItems.set(id, item);

    const rawFilename = item.getFilename();
    const safeFilename = this.sanitizeFilename(rawFilename);

    let savePath = path.join(this.defaultDownloadDir, safeFilename);

    // Prevent traversal out of the default download dir
    if (!savePath.startsWith(this.defaultDownloadDir)) {
      savePath = path.join(this.defaultDownloadDir, 'downloaded_file');
    }

    savePath = this.getUniquePath(savePath);

    item.setSavePath(savePath);

    const state: DownloadState = {
      id,
      filename: path.basename(savePath),
      url: item.getURL(),
      totalBytes: item.getTotalBytes(),
      receivedBytes: item.getReceivedBytes(),
      state: 'progressing',
      savePath
    };
    
    this.downloads.set(id, state);
    this.notifyUpdate(state);

    item.on('updated', (event, internalState) => {
      if (internalState === 'interrupted') {
        state.state = 'interrupted';
      } else if (internalState === 'progressing') {
        state.state = 'progressing';
        state.receivedBytes = item.getReceivedBytes();
        state.totalBytes = item.getTotalBytes();
      }
      this.notifyUpdate(state);
    });

    item.once('done', (event, internalState) => {
      state.state = internalState;
      this.activeItems.delete(id);
      this.notifyUpdate(state);
    });
  }

  public static sanitizeFilename(filename: string): string {
    if (!filename || filename.trim() === '') {
      return 'downloaded_file';
    }
    
    // Convert backslashes to forward slashes for consistent basename extraction on non-Windows
    const normalized = filename.replace(/\\/g, '/');
    let sanitized = path.basename(normalized);
    
    // Remove all path traversal and special characters explicitly
    // This removes typical illegal chars in Windows/Linux/Mac
    sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    
    if (sanitized === '.' || sanitized === '..') {
      return 'downloaded_file';
    }
    
    if (sanitized.length > 200) {
      const ext = path.extname(sanitized);
      const name = path.basename(sanitized, ext);
      sanitized = name.substring(0, 150) + ext;
    }
    
    return sanitized;
  }

  private static getUniquePath(originalPath: string): string {
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const dir = path.dirname(originalPath);
    
    let newPath = originalPath;
    let counter = 1;
    
    while (fs.existsSync(newPath)) {
      newPath = path.join(dir, `${name} (${counter})${ext}`);
      counter++;
    }
    
    return newPath;
  }

  private static notifyUpdate(state: DownloadState) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('download:updated', state);
    }
  }
}
