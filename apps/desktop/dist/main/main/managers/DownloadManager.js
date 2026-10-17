"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class DownloadManager {
    static downloads = new Map();
    static activeItems = new Map();
    static mainWindow = null;
    static _defaultDownloadDir = null;
    static get defaultDownloadDir() {
        if (!this._defaultDownloadDir) {
            try {
                this._defaultDownloadDir = electron_1.app.getPath('downloads');
            }
            catch {
                this._defaultDownloadDir = '/fake/downloads';
            }
        }
        return this._defaultDownloadDir;
    }
    static setup(mainWindow) {
        this.mainWindow = mainWindow;
        electron_1.ipcMain.handle('download:getAll', () => Array.from(this.downloads.values()));
        electron_1.ipcMain.handle('download:cancel', (event, id) => {
            const item = this.activeItems.get(id);
            if (item) {
                item.cancel();
            }
        });
        electron_1.ipcMain.handle('download:open', async (event, id) => {
            const state = this.downloads.get(id);
            if (state?.savePath && state.state === 'completed') {
                electron_1.shell.openPath(state.savePath);
            }
        });
        electron_1.ipcMain.handle('download:reveal', (event, id) => {
            const state = this.downloads.get(id);
            if (state?.savePath && state.state === 'completed') {
                electron_1.shell.showItemInFolder(state.savePath);
            }
        });
        electron_1.ipcMain.handle('download:clearCompleted', () => {
            for (const [id, state] of this.downloads.entries()) {
                if (state.state === 'completed' || state.state === 'cancelled' || state.state === 'interrupted') {
                    this.downloads.delete(id);
                }
            }
        });
    }
    static handleWillDownload(event, item) {
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
        const state = {
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
            }
            else if (internalState === 'progressing') {
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
    static sanitizeFilename(filename) {
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
    static getUniquePath(originalPath) {
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
    static notifyUpdate(state) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('download:updated', state);
        }
    }
}
exports.DownloadManager = DownloadManager;
