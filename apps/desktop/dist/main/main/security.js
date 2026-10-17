"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySecurityControls = applySecurityControls;
const electron_1 = require("electron");
function applySecurityControls(appInstance, window) {
    electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"]
            }
        });
    });
    window.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        const isDev = process.env.NODE_ENV === 'development';
        // In dev, allow localhost. In prod, only allow file protocol.
        const isLocal = isDev
            ? parsedUrl.origin === 'http://localhost:5173'
            : parsedUrl.protocol === 'file:' && parsedUrl.pathname.endsWith('/renderer/index.html');
        if (!isLocal) {
            event.preventDefault();
            console.warn(`Blocked navigation to untrusted URL: ${navigationUrl}`);
        }
    });
    window.webContents.setWindowOpenHandler((details) => {
        console.warn(`Blocked attempt to open new window: ${details.url}`);
        return { action: 'deny' };
    });
    appInstance.on('web-contents-created', (event, contents) => {
        contents.on('will-attach-webview', (e) => {
            // Deny webview tags as per rules
            e.preventDefault();
            console.warn('Blocked <webview> tag creation');
        });
    });
}
