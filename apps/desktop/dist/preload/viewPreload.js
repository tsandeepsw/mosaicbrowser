// src/preload/viewPreload.ts
var import_electron = require("electron");
var OriginalNotification = window.Notification;
if (OriginalNotification) {
  class PatchedNotification extends OriginalNotification {
    constructor(title, options) {
      super(title, options);
      const notificationId = Math.random().toString(36).substring(7);
      import_electron.ipcRenderer.send("notification-created", {
        id: notificationId,
        title,
        body: options?.body,
        icon: options?.icon
      });
      this.addEventListener("click", () => {
        import_electron.ipcRenderer.send("notification-clicked", notificationId);
      });
    }
  }
  window.Notification = PatchedNotification;
}
