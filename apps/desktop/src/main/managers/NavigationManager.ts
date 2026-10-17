import { WebContents } from 'electron';

export class NavigationManager {
  public static readonly ALLOWED_SCHEMES = ['http:', 'https:'];

  public static isValidUrl(urlStr: string): boolean {
    try {
      const url = new URL(urlStr);
      return this.ALLOWED_SCHEMES.includes(url.protocol);
    } catch {
      return false;
    }
  }

  public static enforceHttpsFirst(urlStr: string): string {
    if (urlStr.startsWith('http://')) {
      const url = new URL(urlStr);
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        url.protocol = 'https:';
        return url.toString();
      }
    }
    return urlStr;
  }

  public static apply(webContents: WebContents) {
    webContents.on('will-navigate', (event, navigationUrl) => {
      if (!this.isValidUrl(navigationUrl)) {
        event.preventDefault();
        console.warn(`Blocked unsafe navigation to: ${navigationUrl}`);
      }
    });

    webContents.setWindowOpenHandler((details) => {
      if (!this.isValidUrl(details.url)) {
        console.warn(`Blocked unsafe new window to: ${details.url}`);
        return { action: 'deny' };
      }
      
      webContents.loadURL?.(details.url);
      return { action: 'deny' };
    });
  }
}
