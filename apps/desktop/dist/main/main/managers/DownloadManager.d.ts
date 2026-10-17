import { BrowserWindow, DownloadItem, Event } from 'electron';
export interface DownloadState {
    id: string;
    filename: string;
    url: string;
    totalBytes: number;
    receivedBytes: number;
    state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
    savePath?: string;
}
export declare class DownloadManager {
    private static downloads;
    private static activeItems;
    private static mainWindow;
    private static _defaultDownloadDir;
    private static get defaultDownloadDir();
    static setup(mainWindow: BrowserWindow): void;
    static handleWillDownload(event: Event, item: DownloadItem): void;
    static sanitizeFilename(filename: string): string;
    private static getUniquePath;
    private static notifyUpdate;
}
