import { BrowserWindow, ipcMain } from 'electron';

export class BookmarkDropdownManager {
  private static popup: BrowserWindow | null = null;
  private static mainWindow: BrowserWindow | null = null;

  public static setup(mainWindow: BrowserWindow, storage: any) {
    this.mainWindow = mainWindow;

    ipcMain.handle('bookmarks:showDropdown', async (_event, data: { x: number; y: number; width: number; bookmarks: Array<{ id: string; url: string; title: string }> }) => {
      this.show(data, storage);
    });

    ipcMain.handle('bookmarks:closeDropdown', () => {
      this.close();
    });

    ipcMain.on('bookmarks:select', (_event, url: string) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('app:open-url-in-new-panel', url);
        this.mainWindow.webContents.send('bookmarks:dropdown-closed');
      }
      this.close();
    });

    ipcMain.on('bookmarks:delete', async (_event, id: string) => {
      if (storage) {
        await storage.deleteBookmark(id);
      }
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('bookmarks:updated');
      }
    });

    ipcMain.on('bookmarks:close', () => {
      this.close();
    });

    mainWindow.on('move', () => this.close());
    mainWindow.on('resize', () => this.close());
  }

  public static close() {
    if (this.popup && !this.popup.isDestroyed()) {
      this.popup.destroy();
      this.popup = null;
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('bookmarks:dropdown-closed');
    }
  }

  public static show(data: { x: number; y: number; width: number; bookmarks: Array<{ id: string; url: string; title: string }> }, _storage: any) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    const width = data.width || 280;
    const itemHeight = 32;
    const totalContentHeight = Math.min(380, Math.max(60, data.bookmarks.length * itemHeight + 16));

    const contentBounds = this.mainWindow.getContentBounds();
    const popupX = Math.min(
      contentBounds.x + contentBounds.width - width - 8,
      Math.max(contentBounds.x + 8, contentBounds.x + data.x)
    );
    const popupY = contentBounds.y + data.y;

    if (!this.popup || this.popup.isDestroyed()) {
      this.popup = new BrowserWindow({
        parent: this.mainWindow,
        width,
        height: totalContentHeight,
        x: popupX,
        y: popupY,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        show: false,
        webPreferences: {
          partition: 'dropdown-overlay',
          nodeIntegration: true,
          contextIsolation: false,
        }
      });

      this.popup.on('blur', () => {
        this.close();
      });
    } else {
      this.popup.setBounds({
        x: popupX,
        y: popupY,
        width,
        height: totalContentHeight
      });
    }

    const bookmarksJson = JSON.stringify(data.bookmarks);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            --bg-secondary: #252526;
            --bg-hover: #37373d;
            --border-color: #3e3e42;
            --border-focus: #007fd4;
            --text-primary: #cccccc;
            --text-active: #ffffff;
            --danger: #f14c4c;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 4px;
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            user-select: none;
            overflow: hidden;
          }
          .bookmarks-overflow-dropdown {
            width: 100%;
            height: 100%;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            padding: 4px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            max-height: ${totalContentHeight - 8}px;
            overflow-y: auto;
          }
          .bookmarks-overflow-dropdown::-webkit-scrollbar {
            width: 6px;
          }
          .bookmarks-overflow-dropdown::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 3px;
          }
          .bookmarks-overflow-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            color: var(--text-primary);
            transition: background 0.1s;
            white-space: nowrap;
            overflow: hidden;
          }
          .bookmarks-overflow-item:hover {
            background: var(--bg-hover);
            color: var(--text-active);
          }
          .bookmark-icon {
            color: #f5a623;
            font-size: 12px;
            flex-shrink: 0;
          }
          .bookmarks-overflow-item-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .bookmark-delete {
            margin-left: 2px;
            color: #888;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            line-height: 1;
            transition: all 0.1s;
            flex-shrink: 0;
          }
          .bookmark-delete:hover {
            background-color: rgba(241, 76, 76, 0.2);
            color: var(--danger);
          }
        </style>
      </head>
      <body>
        <div class="bookmarks-overflow-dropdown" id="dropdown"></div>
        <script>
          const { ipcRenderer } = require('electron');
          const bookmarks = ${bookmarksJson};
          const dropdown = document.getElementById('dropdown');

          function render() {
            dropdown.innerHTML = '';
            bookmarks.forEach(b => {
              const item = document.createElement('div');
              item.className = 'bookmarks-overflow-item';
              item.title = b.url;
              item.innerHTML = \`
                <span class="bookmark-icon">★</span>
                <span class="bookmarks-overflow-item-title">\${escapeHtml(b.title)}</span>
                <span class="bookmark-delete" title="Remove Bookmark">✕</span>
              \`;
              item.onclick = (e) => {
                if (e.target.classList.contains('bookmark-delete')) {
                  e.stopPropagation();
                  ipcRenderer.send('bookmarks:delete', b.id);
                  const idx = bookmarks.findIndex(x => x.id === b.id);
                  if (idx !== -1) bookmarks.splice(idx, 1);
                  if (bookmarks.length === 0) {
                    ipcRenderer.send('bookmarks:close');
                  } else {
                    render();
                  }
                } else {
                  ipcRenderer.send('bookmarks:select', b.url);
                }
              };
              dropdown.appendChild(item);
            });
          }

          function escapeHtml(str) {
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          }

          window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              setTimeout(() => {
                ipcRenderer.send('bookmarks:close');
              }, 10);
            }
          });

          render();
        </script>
      </body>
      </html>
    `;

    this.popup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).then(() => {
      this.popup?.show();
    });
  }
}
