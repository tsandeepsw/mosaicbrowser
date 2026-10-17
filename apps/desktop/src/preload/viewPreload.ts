import { ipcRenderer } from 'electron';

// This preload script is injected into untrusted third-party sites.
// It must be extremely minimal.
// We proxy the Notification API to the main process.

const OriginalNotification = window.Notification;

if (OriginalNotification) {
  class PatchedNotification extends OriginalNotification {
    constructor(title: string, options?: NotificationOptions) {
      super(title, options);
      
      const notificationId = Math.random().toString(36).substring(7);
      
      // Notify main process
      ipcRenderer.send('notification-created', {
        id: notificationId,
        title,
        body: options?.body,
        icon: options?.icon,
      });

      this.addEventListener('click', () => {
        ipcRenderer.send('notification-clicked', notificationId);
      });
    }
  }

  window.Notification = PatchedNotification;
}
