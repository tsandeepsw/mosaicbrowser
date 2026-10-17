import { ipcMain, BrowserWindow, Notification as ElectronNotification } from 'electron';
import { WebContentsViewManager } from './WebContentsViewManager';

export interface AppNotification {
  id: string;
  panelId: string;
  title: string;
  body?: string;
  icon?: string;
  timestamp: number;
}

export class NotificationManager {
  private static notifications: AppNotification[] = [];
  
  public static setup(mainWindow: BrowserWindow, viewsMap: Map<string, WebContentsViewManager>) {
    ipcMain.on('notification-created', (event, data) => {
      let panelId: string | null = null;
      for (const [id, viewManager] of viewsMap.entries()) {
        // @ts-expect-error accessing private view
        if (viewManager.view && viewManager.view.webContents === event.sender) {
          panelId = id;
          break;
        }
      }
      
      if (!panelId) return;

      const appNotification: AppNotification = {
        id: data.id,
        panelId,
        title: data.title,
        body: data.body,
        icon: data.icon,
        timestamp: Date.now()
      };

      this.notifications.push(appNotification);
      if (this.notifications.length > 100) {
        this.notifications.shift();
      }

      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('notification-received', appNotification);
      }

      if (ElectronNotification.isSupported()) {
        const nativeNotification = new ElectronNotification({
          title: data.title,
          body: data.body,
        });

        nativeNotification.on('click', () => {
          if (!mainWindow.isDestroyed()) {
            mainWindow.webContents.send('notification-clicked', appNotification);
            mainWindow.show();
            mainWindow.focus();
          }
        });

        nativeNotification.show();
      }
    });

    ipcMain.on('notification-clicked', (event, notificationId) => {
       const notif = this.notifications.find(n => n.id === notificationId);
       if (notif && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('notification-clicked', notif);
          mainWindow.show();
          mainWindow.focus();
       }
    });

    ipcMain.handle('notification:getAll', () => {
      return this.notifications;
    });

    ipcMain.handle('notification:clear', () => {
      this.notifications = [];
    });
  }
}
