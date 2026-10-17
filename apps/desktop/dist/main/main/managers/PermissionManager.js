"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionManager = void 0;
class PermissionManager {
    static permissions = new Map();
    static grant(origin, permission) {
        this.permissions.set(`${origin}:${permission}`, true);
    }
    static deny(origin, permission) {
        this.permissions.set(`${origin}:${permission}`, false);
    }
    static apply(session) {
        session.setPermissionRequestHandler((webContents, permission, callback, details) => {
            let origin;
            try {
                origin = new URL(details.requestingUrl).origin;
            }
            catch {
                origin = details.requestingUrl;
            }
            const key = `${origin}:${permission}`;
            if (this.permissions.has(key)) {
                callback(this.permissions.get(key));
                return;
            }
            console.warn(`Blocked permission request for ${permission} from ${details.requestingUrl}`);
            callback(false);
        });
        session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
            const key = `${requestingOrigin}:${permission}`;
            if (this.permissions.has(key)) {
                return this.permissions.get(key);
            }
            return false;
        });
    }
}
exports.PermissionManager = PermissionManager;
