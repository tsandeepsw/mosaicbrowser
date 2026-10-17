"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebContentsViewManager = void 0;
const electron_1 = require("electron");
const NavigationManager_1 = require("./NavigationManager");
const PermissionManager_1 = require("./PermissionManager");
const SessionManager_1 = require("./SessionManager");
const path = __importStar(require("path"));
class WebContentsViewManager {
    id;
    partitionId;
    onStateChange;
    view = null;
    state;
    sleepTimer = null;
    isBackground = false;
    isMobileEmulationEnabled = false;
    constructor(id, partitionId, onStateChange) {
        this.id = id;
        this.partitionId = partitionId;
        this.onStateChange = onStateChange;
        this.state = {
            id,
            url: '',
            title: '',
            favicon: '',
            isLoading: false,
            canGoBack: false,
            canGoForward: false,
            isCrashed: false
        };
    }
    create(parentWindow) {
        const isolatedSession = SessionManager_1.SessionManager.getIsolatedSession(this.partitionId);
        PermissionManager_1.PermissionManager.apply(isolatedSession);
        this.view = new electron_1.WebContentsView({
            webPreferences: {
                session: isolatedSession,
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                webSecurity: true,
                preload: path.join(__dirname, '../../preload/viewPreload.js'),
            }
        });
        NavigationManager_1.NavigationManager.apply(this.view.webContents);
        this.view.webContents.on('did-start-loading', () => {
            this.state.isLoading = true;
            this.state.isCrashed = false;
            this.onStateChange?.(this.state);
        });
        this.view.webContents.on('did-stop-loading', () => {
            this.state.isLoading = false;
            this.state.canGoBack = this.view.webContents.navigationHistory.canGoBack();
            this.state.canGoForward = this.view.webContents.navigationHistory.canGoForward();
            this.onStateChange?.(this.state);
        });
        this.view.webContents.on('did-navigate', (event, url) => {
            this.state.url = url;
            this.onStateChange?.(this.state);
        });
        this.view.webContents.on('page-title-updated', (event, title) => {
            this.state.title = title;
            this.onStateChange?.(this.state);
        });
        this.view.webContents.on('page-favicon-updated', (event, favicons) => {
            if (favicons.length > 0) {
                this.state.favicon = favicons[0];
                this.onStateChange?.(this.state);
            }
        });
        this.view.webContents.on('render-process-gone', (event, details) => {
            console.error(`Render process crashed: ${details.reason}`);
            this.state.isCrashed = true;
            this.onStateChange?.(this.state);
        });
        parentWindow.contentView.addChildView(this.view);
        this.isBackground = false;
    }
    setBackground(parentWindow, background) {
        if (!this.view)
            return;
        this.isBackground = background;
        if (background) {
            try {
                // macOS bounds hack: prevent background ghosting
                this.view.setBounds({ x: 9999, y: 9999, width: 0, height: 0 });
                parentWindow.contentView.removeChildView(this.view);
            }
            catch { }
            this.view.webContents.setAudioMuted(true);
            // Sleep after 60 seconds of background for testing/benchmarking purposes
            this.sleepTimer = setTimeout(() => {
                console.log(`Sleeping view ${this.id}`);
                this.destroy(parentWindow);
            }, 60 * 1000);
        }
        else {
            if (this.sleepTimer) {
                clearTimeout(this.sleepTimer);
                this.sleepTimer = null;
            }
            parentWindow.contentView.addChildView(this.view);
            this.view.webContents.setAudioMuted(false);
        }
    }
    async navigate(url) {
        if (!this.view)
            throw new Error("View not created");
        let finalUrl = url;
        if (!NavigationManager_1.NavigationManager.isValidUrl(url)) {
            throw new Error(`Invalid URL scheme: ${url}`);
        }
        finalUrl = NavigationManager_1.NavigationManager.enforceHttpsFirst(finalUrl);
        try {
            await this.view.webContents.loadURL(finalUrl);
        }
        catch (error) {
            if (error.code === 'ERR_ABORTED' || error.code === 'ERR_FAILED') {
                return;
            }
            throw error;
        }
    }
    reload() {
        if (this.view) {
            this.view.webContents.reload();
        }
    }
    setBounds(bounds) {
        if (this.view) {
            this.view.setBounds(bounds);
            // Force mobile emulation when the panel width is narrow
            const shouldBeMobile = bounds.width <= 768;
            if (shouldBeMobile && !this.isMobileEmulationEnabled) {
                this.view.webContents.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36');
                this.isMobileEmulationEnabled = true;
            }
            else if (!shouldBeMobile && this.isMobileEmulationEnabled) {
                this.view.webContents.setUserAgent(this.view.webContents.getUserAgent().replace('Mobile ', ''));
                this.isMobileEmulationEnabled = false;
            }
        }
    }
    focus() {
        if (this.view) {
            this.view.webContents.focus();
        }
    }
    destroy(parentWindow) {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;
        }
        if (this.view) {
            // Step 1: Remove from the window's view hierarchy immediately.
            // This makes the native layer stop compositing it — the page visually
            // disappears right away, regardless of what the webContents does next.
            try {
                this.view.setBounds({ x: 9999, y: 9999, width: 0, height: 0 });
                parentWindow.contentView.removeChildView(this.view);
            }
            catch (e) {
                console.error('Failed to remove child view:', e);
            }
            // Step 2: Destroy the webContents unconditionally.
            // We must NOT use webContents.close() here — close() fires the 'close' event
            // and respects beforeunload handlers, meaning the page (e.g. Google) can delay
            // or block teardown, leaving a ghost render. destroy() is immediate and
            // cannot be intercepted.
            try {
                this.view.webContents.destroy();
            }
            catch (e) {
                console.error('Failed to destroy webContents:', e);
            }
            this.view = null;
        }
    }
}
exports.WebContentsViewManager = WebContentsViewManager;
