import { WebContentsView, BaseWindow, BrowserWindow, Menu, MenuItemConstructorOptions, clipboard, shell } from 'electron';
import { NavigationManager } from './NavigationManager';
import { PermissionManager } from './PermissionManager';
import { SessionManager } from './SessionManager';
import * as path from 'path';

export interface ViewState {
  id: string;
  url: string;
  title: string;
  favicon: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isCrashed: boolean;
}

export class WebContentsViewManager {
  private view: WebContentsView | null = null;
  public state: ViewState;
  private sleepTimer: NodeJS.Timeout | null = null;
  public isBackground: boolean = false;
  private isMobileEmulationEnabled = false;
  private parentWindow: BaseWindow | null = null;
  private isHtmlFullScreen: boolean = false;
  private preFullscreenBounds: Electron.Rectangle | null = null;
  private wasParentFullScreen: boolean = false;
  private resizeHandler: (() => void) | null = null;
  private historyStack: string[] = [];
  private historyIndex: number = -1;
  private isNavigatingHistory: boolean = false;

  constructor(
    public readonly id: string,
    public readonly partitionId: string,
    private onStateChange?: (state: ViewState) => void
  ) {
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

  private recordNavigation(url: string) {
    if (!url || url === 'about:blank') return;

    const cleanUrl = url.replace(/\/$/, '');
    const currentClean = this.historyStack[this.historyIndex]?.replace(/\/$/, '');

    if (this.isNavigatingHistory) {
      const foundIdx = this.historyStack.findIndex((u) => u.replace(/\/$/, '') === cleanUrl);
      if (foundIdx !== -1) {
        this.historyIndex = foundIdx;
      }
      this.isNavigatingHistory = false;
    } else if (cleanUrl !== currentClean) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      this.historyStack.push(url);
      this.historyIndex = this.historyStack.length - 1;
    }

    this.state.url = url;
    this.updateNavigationState();
  }

  private updateNavigationState() {
    if (!this.view) return;
    try {
      const wc = this.view.webContents;
      if ((wc as any).isDestroyed?.()) return;

      const nativeCanGoBack = Boolean(
        typeof wc.navigationHistory?.canGoBack === 'function'
          ? wc.navigationHistory.canGoBack()
          : wc.canGoBack?.()
      );
      const nativeCanGoForward = Boolean(
        typeof wc.navigationHistory?.canGoForward === 'function'
          ? wc.navigationHistory.canGoForward()
          : wc.canGoForward?.()
      );

      const stackCanGoBack = this.historyIndex > 0;
      const stackCanGoForward = this.historyIndex >= 0 && this.historyIndex < this.historyStack.length - 1;

      this.state.canGoBack = nativeCanGoBack || stackCanGoBack;
      this.state.canGoForward = nativeCanGoForward || stackCanGoForward;

      const currentUrl = wc.getURL();
      if (currentUrl && currentUrl !== 'about:blank') {
        this.state.url = currentUrl;
      }
      const currentTitle = wc.getTitle();
      if (currentTitle) {
        this.state.title = currentTitle;
      }
      this.onStateChange?.({ ...this.state });
    } catch (e) {
      console.error('Error updating navigation state:', e);
    }
  }

  public create(parentWindow: BaseWindow) {
    this.parentWindow = parentWindow;
    const isolatedSession = SessionManager.getIsolatedSession(this.partitionId);
    PermissionManager.apply(isolatedSession);

    this.view = new WebContentsView({
      webPreferences: {
        session: isolatedSession,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        preload: path.join(__dirname, '../preload/viewPreload.js'),
      }
    });

    NavigationManager.apply(this.view.webContents);

    this.view.webContents.on('did-start-loading', () => {
      this.state.isLoading = true;
      this.state.isCrashed = false;
      this.updateNavigationState();
    });

    this.view.webContents.on('did-stop-loading', () => {
      this.state.isLoading = false;
      this.updateNavigationState();
    });

    this.view.webContents.on('did-navigate', (_event, url) => {
      this.recordNavigation(url);
    });

    this.view.webContents.on('did-navigate-in-page', (_event, url) => {
      this.recordNavigation(url);
    });

    this.view.webContents.on('did-frame-finish-load', () => {
      this.updateNavigationState();
    });

    this.view.webContents.on('page-title-updated', (_event, title) => {
      this.state.title = title;
      this.onStateChange?.({ ...this.state });
    });

    this.view.webContents.on('page-favicon-updated', (_event, favicons) => {
      if (favicons.length > 0) {
        this.state.favicon = favicons[0];
        this.onStateChange?.({ ...this.state });
      }
    });

    this.view.webContents.on('render-process-gone', (_event, details) => {
      console.error(`Render process crashed: ${details.reason}`);
      this.state.isCrashed = true;
      this.onStateChange?.({ ...this.state });
    });

    // Handle HTML5 video / element full screen
    this.view.webContents.on('enter-html-full-screen', () => {
      this.isHtmlFullScreen = true;
      if (this.view) {
        this.preFullscreenBounds = this.view.getBounds();
      }
      if (this.parentWindow && !this.parentWindow.isDestroyed?.()) {
        const bw = this.parentWindow as BrowserWindow;
        if (typeof bw.isFullScreen === 'function') {
          this.wasParentFullScreen = bw.isFullScreen();
          if (!this.wasParentFullScreen && typeof bw.setFullScreen === 'function') {
            bw.setFullScreen(true);
          }
        }
        if (typeof bw.getContentSize === 'function') {
          const [width, height] = bw.getContentSize();
          this.view?.setBounds({ x: 0, y: 0, width, height });
        }
        try {
          this.parentWindow.contentView?.addChildView?.(this.view!);
        } catch {}
      }
    });

    this.view.webContents.on('leave-html-full-screen', () => {
      this.isHtmlFullScreen = false;
      if (this.parentWindow && !this.parentWindow.isDestroyed?.()) {
        const bw = this.parentWindow as BrowserWindow;
        if (!this.wasParentFullScreen && typeof bw.isFullScreen === 'function' && bw.isFullScreen() && typeof bw.setFullScreen === 'function') {
          bw.setFullScreen(false);
        }
      }
      if (this.preFullscreenBounds && this.view) {
        this.view.setBounds(this.preFullscreenBounds);
      }
    });

    this.resizeHandler = () => {
      if (this.isHtmlFullScreen && this.view && this.parentWindow && !this.parentWindow.isDestroyed?.()) {
        const bw = this.parentWindow as BrowserWindow;
        if (typeof bw.getContentSize === 'function') {
          const [width, height] = bw.getContentSize();
          this.view.setBounds({ x: 0, y: 0, width, height });
        }
      }
    };

    if (this.parentWindow && typeof (this.parentWindow as any).on === 'function') {
      (this.parentWindow as any).on('resize', this.resizeHandler);
      (this.parentWindow as any).on('enter-full-screen', this.resizeHandler);
      (this.parentWindow as any).on('leave-full-screen', this.resizeHandler);
    }

    // Right-click context menu
    this.view.webContents.on('context-menu', (_event, params) => {
      const menuItems: MenuItemConstructorOptions[] = [];

      if (params.linkURL) {
        menuItems.push(
          {
            label: 'Open Link in New Panel',
            click: () => {
              if (this.parentWindow && !this.parentWindow.isDestroyed()) {
                (this.parentWindow as BrowserWindow).webContents.send('app:open-url-in-new-panel', params.linkURL);
              }
            },
          },
          {
            label: 'Copy Link Address',
            click: () => clipboard.writeText(params.linkURL),
          },
          { type: 'separator' }
        );
      }

      if (params.hasImageContents || params.mediaType === 'image') {
        menuItems.push(
          {
            label: 'Copy Image',
            click: () => this.view?.webContents.copyImageAt(params.x, params.y),
          },
          {
            label: 'Copy Image Address',
            click: () => clipboard.writeText(params.srcURL),
          },
          {
            label: 'Save Image As...',
            click: () => {
              if (this.view && params.srcURL) {
                this.view.webContents.downloadURL(params.srcURL);
              }
            },
          },
          { type: 'separator' }
        );
      }

      if (params.selectionText && params.selectionText.trim().length > 0) {
        const text = params.selectionText.trim();
        const displayQuery = text.length > 25 ? text.substring(0, 25) + '…' : text;
        menuItems.push(
          {
            role: 'copy',
            label: 'Copy',
          },
          {
            label: `Search Google for "${displayQuery}"`,
            click: () => {
              const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
              shell.openExternal(searchUrl);
            },
          },
          { type: 'separator' }
        );
      }

      if (params.isEditable) {
        menuItems.push(
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'selectAll' },
          { type: 'separator' }
        );
      }

      menuItems.push(
        {
          label: 'Back',
          enabled: this.state.canGoBack,
          click: () => this.goBack(),
        },
        {
          label: 'Forward',
          enabled: this.state.canGoForward,
          click: () => this.goForward(),
        },
        {
          label: 'Reload',
          click: () => this.reload(),
        },
        { type: 'separator' },
        {
          label: 'Inspect Element',
          click: () => {
            this.view?.webContents.inspectElement(params.x, params.y);
            if (this.view && !this.view.webContents.isDevToolsOpened()) {
              this.view.webContents.openDevTools({ mode: 'detach' });
            }
          },
        }
      );

      const menu = Menu.buildFromTemplate(menuItems);
      if (this.parentWindow && !this.parentWindow.isDestroyed()) {
        menu.popup({ window: this.parentWindow as BrowserWindow });
      } else {
        menu.popup();
      }
    });

    parentWindow.contentView.addChildView(this.view);
    this.isBackground = false;
  }

  public setBackground(parentWindow: BaseWindow, background: boolean) {
    if (!this.view) return;
    this.isBackground = background;

    if (background) {
      try {
        this.view.setBounds({ x: 9999, y: 9999, width: 0, height: 0 });
        parentWindow.contentView.removeChildView(this.view);
      } catch { }
      this.view.webContents.setAudioMuted(true);

      this.sleepTimer = setTimeout(() => {
        console.log(`Sleeping view ${this.id}`);
        this.destroy(parentWindow);
      }, 60 * 1000);
    } else {
      if (this.sleepTimer) {
        clearTimeout(this.sleepTimer);
        this.sleepTimer = null;
      }
      parentWindow.contentView.addChildView(this.view);
      this.view.webContents.setAudioMuted(false);
    }
  }

  public async navigate(url: string) {
    if (!this.view) throw new Error("View not created");

    let finalUrl = url;
    if (!NavigationManager.isValidUrl(url)) {
      throw new Error(`Invalid URL scheme: ${url}`);
    }

    finalUrl = NavigationManager.enforceHttpsFirst(finalUrl);
    try {
      await this.view.webContents.loadURL(finalUrl);
    } catch (error: any) {
      if (error.code === 'ERR_ABORTED' || error.code === 'ERR_FAILED') {
        return;
      }
      throw error;
    }
  }

  public reload() {
    if (this.view) {
      this.view.webContents.reload();
    }
  }

  public goBack() {
    if (!this.view) return;
    const wc = this.view.webContents;
    if ((wc as any).isDestroyed?.()) return;

    this.isNavigatingHistory = true;

    const canNative = typeof wc.navigationHistory?.canGoBack === 'function'
      ? wc.navigationHistory.canGoBack()
      : wc.canGoBack?.();

    if (canNative) {
      if (typeof wc.navigationHistory?.goBack === 'function') {
        wc.navigationHistory.goBack();
      } else if (typeof wc.goBack === 'function') {
        wc.goBack();
      }
      if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
      const targetUrl = this.historyStack[this.historyIndex];
      if (targetUrl) {
        wc.loadURL(targetUrl).catch(console.error);
      }
    }

    setTimeout(() => {
      this.isNavigatingHistory = false;
      this.updateNavigationState();
    }, 100);
  }

  public goForward() {
    if (!this.view) return;
    const wc = this.view.webContents;
    if ((wc as any).isDestroyed?.()) return;

    this.isNavigatingHistory = true;

    const canNative = typeof wc.navigationHistory?.canGoForward === 'function'
      ? wc.navigationHistory.canGoForward()
      : wc.canGoForward?.();

    if (canNative) {
      if (typeof wc.navigationHistory?.goForward === 'function') {
        wc.navigationHistory.goForward();
      } else if (typeof wc.goForward === 'function') {
        wc.goForward();
      }
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyIndex++;
      }
    } else if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      const targetUrl = this.historyStack[this.historyIndex];
      if (targetUrl) {
        wc.loadURL(targetUrl).catch(console.error);
      }
    }

    setTimeout(() => {
      this.isNavigatingHistory = false;
      this.updateNavigationState();
    }, 100);
  }

  public setBounds(bounds: Electron.Rectangle) {
    if (this.isHtmlFullScreen) {
      this.preFullscreenBounds = bounds;
      if (this.parentWindow && !this.parentWindow.isDestroyed()) {
        const [width, height] = (this.parentWindow as BrowserWindow).getContentSize();
        this.view?.setBounds({ x: 0, y: 0, width, height });
      }
      return;
    }

    if (this.view) {
      this.view.setBounds(bounds);

      // Force mobile emulation when the panel width is narrow
      const shouldBeMobile = bounds.width <= 768;

      if (shouldBeMobile && !this.isMobileEmulationEnabled) {
        this.view.webContents.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36');
        this.isMobileEmulationEnabled = true;
      } else if (!shouldBeMobile && this.isMobileEmulationEnabled) {
        this.view.webContents.setUserAgent(this.view.webContents.getUserAgent().replace('Mobile ', ''));
        this.isMobileEmulationEnabled = false;
      }
    }
  }

  public focus() {
    if (this.view) {
      this.view.webContents.focus();
    }
  }

  public destroy(parentWindow: BaseWindow) {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }

    if (this.parentWindow && this.resizeHandler && typeof (this.parentWindow as any).off === 'function') {
      try {
        (this.parentWindow as any).off('resize', this.resizeHandler);
        (this.parentWindow as any).off('enter-full-screen', this.resizeHandler);
        (this.parentWindow as any).off('leave-full-screen', this.resizeHandler);
      } catch {}
      this.resizeHandler = null;
    }

    if (this.view) {
      try {
        this.view.setBounds({ x: 9999, y: 9999, width: 0, height: 0 });
        parentWindow.contentView.removeChildView(this.view);
      } catch (e) {
        console.error('Failed to remove child view:', e);
      }

      try {
        (this.view.webContents as any).destroy();
      } catch (e) {
        console.error('Failed to destroy webContents:', e);
      }

      this.view = null;
    }
  }
}
