"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellManager = void 0;
const electron_1 = require("electron");
const NavigationManager_1 = require("./NavigationManager");
class ShellManager {
    static async openExternal(urlStr) {
        if (!NavigationManager_1.NavigationManager.isValidUrl(urlStr)) {
            console.warn(`Blocked attempt to open external unsafe URL: ${urlStr}`);
            return false;
        }
        // Explicitly parse URL to verify again to prevent argument injection
        try {
            const parsedUrl = new URL(urlStr);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                console.warn(`Protocol not allowed for external open: ${parsedUrl.protocol}`);
                return false;
            }
            // Ensure no sneaky arguments are passed by just passing the reconstructed safe URL string
            await electron_1.shell.openExternal(parsedUrl.toString());
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.ShellManager = ShellManager;
