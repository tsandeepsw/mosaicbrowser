"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// This preload script is injected into untrusted third-party sites.
// It must be extremely minimal.
// We proxy the Notification API to the main process.
const OriginalNotification = window.Notification;
if (OriginalNotification) {
    class PatchedNotification extends OriginalNotification {
        constructor(title, options) {
            super(title, options);
            const notificationId = Math.random().toString(36).substring(7);
            // Notify main process
            electron_1.ipcRenderer.send('notification-created', {
                id: notificationId,
                title,
                body: options?.body,
                icon: options?.icon,
            });
            this.addEventListener('click', () => {
                electron_1.ipcRenderer.send('notification-clicked', notificationId);
            });
        }
    }
    window.Notification = PatchedNotification;
}
