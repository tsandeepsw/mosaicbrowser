 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavigationManager } from './NavigationManager';
import { PermissionManager } from './PermissionManager';
import { SessionManager } from './SessionManager';
import { WebContentsViewManager } from './WebContentsViewManager';

const mocks = vi.hoisted(() => {
  const sessionBase = {
    setPermissionRequestHandler: vi.fn(),
    setPermissionCheckHandler: vi.fn(),
    listeners: vi.fn().mockReturnValue([]),
    on: vi.fn()
  };
  return {
    mockSession: sessionBase,
    mockFromPartition: vi.fn().mockImplementation((id: string) => ({ ...sessionBase, id })),
    mockWebContentsView: vi.fn(),
    mockBaseWindow: {
      contentView: {
        addChildView: vi.fn(),
        removeChildView: vi.fn()
      }
    }
  };
});

vi.mock('electron', () => ({
  session: {
    fromPartition: mocks.mockFromPartition
  },
  WebContentsView: mocks.mockWebContentsView
}));

describe('WebContentsView Infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SessionManager', () => {
    it('should prefix partition with persist: automatically', () => {
      SessionManager.getIsolatedSession('test1');
      expect(mocks.mockFromPartition).toHaveBeenCalledWith('persist:test1');
    });

    it('should not double-prefix persist:', () => {
      SessionManager.getIsolatedSession('persist:test2');
      expect(mocks.mockFromPartition).toHaveBeenCalledWith('persist:test2');
    });

    it('should route downloads through DownloadManager securely', () => {
      const session = SessionManager.getIsolatedSession('download-test');
      expect(session.listeners).toHaveBeenCalledWith('will-download');
      expect(session.on).toHaveBeenCalledWith('will-download', expect.any(Function));

      const downloadHandler = vi.mocked(session.on).mock.calls.find(c => c[0] === 'will-download')?.[1];
      const event = { preventDefault: vi.fn() };
      const item = { 
        getURL: vi.fn().mockReturnValue('http://evil.com/malware.exe'),
        getFilename: vi.fn().mockReturnValue('malware.exe'),
        setSavePath: vi.fn(),
        getTotalBytes: vi.fn().mockReturnValue(100),
        getReceivedBytes: vi.fn().mockReturnValue(0),
        on: vi.fn(),
        once: vi.fn()
      };
      const webContents = {} as any;
      downloadHandler?.(event as any, item as any, webContents);
      expect(item.getFilename).toHaveBeenCalled();
      expect(item.setSavePath).toHaveBeenCalled();
    });
  });

  describe('Profile Isolation', () => {
    it('should provide different sessions for different profiles', () => {
      const session1 = SessionManager.getIsolatedSession('personal');
      const session2 = SessionManager.getIsolatedSession('work');

      expect(mocks.mockFromPartition).toHaveBeenCalledWith('persist:personal');
      expect(mocks.mockFromPartition).toHaveBeenCalledWith('persist:work');
      
      expect((session1 as any).id).toBe('persist:personal');
      expect((session2 as any).id).toBe('persist:work');
    });

    it('should assign correct session to WebContentsView based on profile', () => {
      const mockWebContents = {
        on: vi.fn(),
        setWindowOpenHandler: vi.fn()
      };

      mocks.mockWebContentsView.mockImplementation(function(this: any, args: any) {
        this.webContents = mockWebContents;
        this.webPreferences = args.webPreferences;
        return this;
      });

      const manager1 = new WebContentsViewManager('view1', 'personal');
      const manager2 = new WebContentsViewManager('view2', 'work');

      manager1.create(mocks.mockBaseWindow as any);
      manager2.create(mocks.mockBaseWindow as any);

      // @ts-expect-error test
      const prefs1 = manager1.view!.webPreferences;
      // @ts-expect-error test
      const prefs2 = manager2.view!.webPreferences;

      expect(prefs1.session.id).toBe('persist:personal');
      expect(prefs2.session.id).toBe('persist:work');
    });
  });

  describe('PermissionManager', () => {
    it('should deny all permissions', () => {
      PermissionManager.apply(mocks.mockSession as any);
      
      expect(mocks.mockSession.setPermissionRequestHandler).toHaveBeenCalled();
      const reqHandler = mocks.mockSession.setPermissionRequestHandler.mock.calls[0][0];
      
      const callback = vi.fn();
      reqHandler({} as any, 'camera', callback, { requestingUrl: 'https://evil.com' });
      expect(callback).toHaveBeenCalledWith(false);

      expect(mocks.mockSession.setPermissionCheckHandler).toHaveBeenCalled();
      const checkHandler = mocks.mockSession.setPermissionCheckHandler.mock.calls[0][0];
      expect(checkHandler()).toBe(false);
    });
  });

  describe('NavigationManager', () => {
    it('should validate URLs correctly', () => {
      expect(NavigationManager.isValidUrl('https://example.com')).toBe(true);
      expect(NavigationManager.isValidUrl('http://example.com')).toBe(true);
      expect(NavigationManager.isValidUrl('file:///etc/passwd')).toBe(false);
      expect(NavigationManager.isValidUrl('javascript:alert(1)')).toBe(false);
      expect(NavigationManager.isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
    });

    it('should enforce HTTPS first', () => {
      expect(NavigationManager.enforceHttpsFirst('http://example.com')).toBe('https://example.com/');
      expect(NavigationManager.enforceHttpsFirst('http://localhost:3000')).toBe('http://localhost:3000');
    });

    it('should enforce navigation policy on webContents', () => {
      const mockWebContents = {
        on: vi.fn(),
        setWindowOpenHandler: vi.fn()
      };
      
      NavigationManager.apply(mockWebContents as any);
      
      const onNavigate = mockWebContents.on.mock.calls.find(c => c[0] === 'will-navigate')?.[1];
      const event = { preventDefault: vi.fn() };
      
      onNavigate(event, 'file:///bad');
      expect(event.preventDefault).toHaveBeenCalled();
      
      const handler = mockWebContents.setWindowOpenHandler.mock.calls[0][0];
      expect(handler({ url: 'file:///bad' })).toEqual({ action: 'deny' });
      expect(handler({ url: 'https://good.com' })).toEqual({ action: 'deny' });
    });
  });

  describe('WebContentsViewManager Lifecycle and Crash Handling', () => {
    it('should setup lifecycle events properly', async () => {
      const mockWebContents = {
        on: vi.fn(),
        canGoBack: vi.fn().mockReturnValue(true),
        canGoForward: vi.fn().mockReturnValue(false),
        navigationHistory: {
          canGoBack: vi.fn().mockReturnValue(true),
          canGoForward: vi.fn().mockReturnValue(false)
        },
        loadURL: vi.fn(),
        close: vi.fn(),
        destroy: vi.fn(),
        setWindowOpenHandler: vi.fn()
      };

      mocks.mockWebContentsView.mockImplementation(function(this: any) {
        this.webContents = mockWebContents;
        this.setBounds = vi.fn();
        return this;
      });

      const manager = new WebContentsViewManager('view1', 'part1');
      manager.create(mocks.mockBaseWindow as any);

      expect(mocks.mockBaseWindow.contentView.addChildView).toHaveBeenCalled();

      // Trigger did-start-loading
      mockWebContents.on.mock.calls.find(c => c[0] === 'did-start-loading')?.[1]();
      expect(manager.state.isLoading).toBe(true);

      // Trigger did-stop-loading
      mockWebContents.on.mock.calls.find(c => c[0] === 'did-stop-loading')?.[1]();
      expect(manager.state.isLoading).toBe(false);
      expect(manager.state.canGoBack).toBe(true);

      // Trigger crash
      mockWebContents.on.mock.calls.find(c => c[0] === 'render-process-gone')?.[1]({}, { reason: 'crashed' });
      expect(manager.state.isCrashed).toBe(true);

      manager.destroy(mocks.mockBaseWindow as any);
      expect(mocks.mockBaseWindow.contentView.removeChildView).toHaveBeenCalled();
      expect(mockWebContents.destroy).toHaveBeenCalled();
    });
  });
});
