"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationManager = void 0;
class NavigationManager {
    static ALLOWED_SCHEMES = ['http:', 'https:'];
    static isValidUrl(urlStr) {
        try {
            const url = new URL(urlStr);
            return this.ALLOWED_SCHEMES.includes(url.protocol);
        }
        catch {
            return false;
        }
    }
    static enforceHttpsFirst(urlStr) {
        if (urlStr.startsWith('http://')) {
            const url = new URL(urlStr);
            if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
                url.protocol = 'https:';
                return url.toString();
            }
        }
        return urlStr;
    }
    static apply(webContents) {
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
            return { action: 'deny' };
        });
    }
}
exports.NavigationManager = NavigationManager;
