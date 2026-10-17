import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationManager } from './NotificationManager';
import { PermissionManager } from './PermissionManager';
import { ipcMain } from 'electron';

const mocks = vi.hoisted(() => {
  const mockShow = vi.fn();
  const mockOn = vi.fn();
  
  const NotificationMock = vi.fn().mockImplementation(function() {
    // @ts-expect-error mocking
    this.show = mockShow;
    // @ts-expect-error mocking
    this.on = mockOn;
  });
  
  return {
    mockNotification: NotificationMock,
    mockIsSupported: vi.fn().mockReturnValue(true),
    mockShow,
    mockOn
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn()
  },
  Notification: Object.assign(mocks.mockNotification, {
    isSupported: mocks.mockIsSupported
  })
}));

describe('Notification and Permission System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PermissionManager', () => {
    it('should allow explicitly granted permissions', () => {
      PermissionManager.grant('https://allowed.com', 'notifications');
      
      const session = {
        setPermissionRequestHandler: vi.fn(),
        setPermissionCheckHandler: vi.fn()
      };
      
      // @ts-expect-error mocking
      PermissionManager.apply(session);

      const requestHandler = session.setPermissionRequestHandler.mock.calls[0][0];
      const callbackGranted = vi.fn();
      requestHandler(null, 'notifications', callbackGranted, { requestingUrl: 'https://allowed.com/path' });
      expect(callbackGranted).toHaveBeenCalledWith(true);

      const callbackDenied = vi.fn();
      requestHandler(null, 'notifications', callbackDenied, { requestingUrl: 'https://denied.com' });
      expect(callbackDenied).toHaveBeenCalledWith(false);
    });

    it('should deny explicitly denied permissions', () => {
      PermissionManager.deny('https://denied.com', 'notifications');
      
      const session = {
        setPermissionRequestHandler: vi.fn(),
        setPermissionCheckHandler: vi.fn()
      };
      
      // @ts-expect-error mocking
      PermissionManager.apply(session);

      const requestHandler = session.setPermissionRequestHandler.mock.calls[0][0];
      const callback = vi.fn();
      requestHandler(null, 'notifications', callback, { requestingUrl: 'https://denied.com' });
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('NotificationManager', () => {
    it('should route notifications to UI and OS and handle clicks', () => {
      const mainWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() },
        show: vi.fn(),
        focus: vi.fn()
      };

      const viewsMap = new Map();
      const mockWebContents = {};
      viewsMap.set('panel1', { view: { webContents: mockWebContents } });

      // @ts-expect-error mocking
      NotificationManager.setup(mainWindow, viewsMap);

      const onCreatedHandler = vi.mocked(ipcMain.on).mock.calls.find(c => c[0] === 'notification-created')?.[1];
      expect(onCreatedHandler).toBeDefined();

      // Trigger notification
      onCreatedHandler!({ sender: mockWebContents } as any, {
        id: 'n1', title: 'Test', body: 'Body'
      });

      // UI should receive
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('notification-received', expect.objectContaining({
        id: 'n1', panelId: 'panel1', title: 'Test'
      }));

      // OS should show
      expect(mocks.mockNotification).toHaveBeenCalled();
      expect(mocks.mockShow).toHaveBeenCalled();

      // Handle OS click
      const onClickHandler = mocks.mockOn.mock.calls.find((c: any[]) => c[0] === 'click')?.[1];
      onClickHandler();

      expect(mainWindow.webContents.send).toHaveBeenCalledWith('notification-clicked', expect.objectContaining({
        id: 'n1', panelId: 'panel1'
      }));
      expect(mainWindow.show).toHaveBeenCalled();
      expect(mainWindow.focus).toHaveBeenCalled();
    });

    it('should handle notification when panel no longer exists', () => {
      const mainWindow = {
        isDestroyed: () => false,
        webContents: { send: vi.fn() }
      };

      const viewsMap = new Map();
      // Panel does not exist in viewsMap

      // @ts-expect-error mocking
      NotificationManager.setup(mainWindow, viewsMap);

      const onCreatedHandler = vi.mocked(ipcMain.on).mock.calls.find(c => c[0] === 'notification-created')?.[1];
      
      onCreatedHandler!({ sender: {} } as any, {
        id: 'n2', title: 'Ghost', body: 'Should be ignored'
      });

      // UI should NOT receive
      expect(mainWindow.webContents.send).not.toHaveBeenCalled();
      // OS should NOT show
      expect(mocks.mockNotification).not.toHaveBeenCalled();
    });
  });
});
