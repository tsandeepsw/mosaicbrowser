import { BrowserWindow } from 'electron';
import { WebContentsViewManager } from './WebContentsViewManager';
export interface AppNotification {
    id: string;
    panelId: string;
    title: string;
    body?: string;
    icon?: string;
    timestamp: number;
}
export declare class NotificationManager {
    private static notifications;
    static setup(mainWindow: BrowserWindow, viewsMap: Map<string, WebContentsViewManager>): void;
}
