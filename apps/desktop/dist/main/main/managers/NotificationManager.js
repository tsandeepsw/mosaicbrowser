"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const electron_1 = require("electron");
class NotificationManager {
    static notifications = [];
    static setup(mainWindow, viewsMap) {
        electron_1.ipcMain.on('notification-created', (event, data) => {
            let panelId = null;
            for (const [id, viewManager] of viewsMap.entries()) {
                // @ts-expect-error accessing private view
                if (viewManager.view && viewManager.view.webContents === event.sender) {
                    panelId = id;
                    break;
                }
            }
            if (!panelId)
                return;
            const appNotification = {
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
            if (electron_1.Notification.isSupported()) {
                const nativeNotification = new electron_1.Notification({
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
        electron_1.ipcMain.on('notification-clicked', (event, notificationId) => {
            const notif = this.notifications.find(n => n.id === notificationId);
            if (notif && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('notification-clicked', notif);
                mainWindow.show();
                mainWindow.focus();
            }
        });
        electron_1.ipcMain.handle('notification:getAll', () => {
            return this.notifications;
        });
        electron_1.ipcMain.handle('notification:clear', () => {
            this.notifications = [];
        });
    }
}
exports.NotificationManager = NotificationManager;
