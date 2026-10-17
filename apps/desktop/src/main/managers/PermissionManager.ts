import { Session } from 'electron';

export class PermissionManager {
  private static permissions = new Map<string, boolean>();

  public static grant(origin: string, permission: string) {
    this.permissions.set(`${origin}:${permission}`, true);
  }

  public static deny(origin: string, permission: string) {
    this.permissions.set(`${origin}:${permission}`, false);
  }

  public static apply(session: Session) {
    session.setPermissionRequestHandler((webContents, permission, callback, details) => {
      if (permission === 'fullscreen' || permission === 'pointerLock') {
        callback(true);
        return;
      }

      let origin: string;
      try {
        origin = new URL(details.requestingUrl).origin;
      } catch {
        origin = details.requestingUrl;
      }
      
      const key = `${origin}:${permission}`;
      if (this.permissions.has(key)) {
        callback(this.permissions.get(key) as boolean);
        return;
      }

      console.warn(`Blocked permission request for ${permission} from ${details.requestingUrl}`);
      callback(false);
    });

    session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
      if (permission === 'fullscreen' || permission === 'pointerLock') {
        return true;
      }

      const key = `${requestingOrigin}:${permission}`;
      if (this.permissions.has(key)) {
        return this.permissions.get(key) as boolean;
      }
      return false;
    });
  }
}
