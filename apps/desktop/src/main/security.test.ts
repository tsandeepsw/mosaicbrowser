import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    mockApp: {
      on: vi.fn(),
    },
    mockWindow: {
      webContents: {
        on: vi.fn(),
        setWindowOpenHandler: vi.fn(),
      }
    },
    mockSession: {
      defaultSession: {
        webRequest: {
          onHeadersReceived: vi.fn(),
        }
      }
    }
  };
});

vi.mock('electron', () => ({
  app: mocks.mockApp,
  session: mocks.mockSession
}));

describe('Electron Security Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set Content-Security-Policy header', async () => {
    const { applySecurityControls } = await import('./security');
    
     
    applySecurityControls(mocks.mockApp as any, mocks.mockWindow as any);
    
    expect(mocks.mockSession.defaultSession.webRequest.onHeadersReceived).toHaveBeenCalled();
  });

  it('should block navigation to arbitrary file URLs in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { applySecurityControls } = await import('./security');
    
     
    applySecurityControls(mocks.mockApp as any, mocks.mockWindow as any);

    const onWillNavigate = mocks.mockWindow.webContents.on.mock.calls.find((c: any[]) => c[0] === 'will-navigate')?.[1];
    expect(onWillNavigate).toBeDefined();

    const mockEvent1 = { preventDefault: vi.fn() };
    onWillNavigate(mockEvent1, 'file:///etc/passwd');
    expect(mockEvent1.preventDefault).toHaveBeenCalled();

    const mockEvent2 = { preventDefault: vi.fn() };
    onWillNavigate(mockEvent2, 'file:///some/path/renderer/index.html');
    expect(mockEvent2.preventDefault).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should block window open attempts', async () => {
    const { applySecurityControls } = await import('./security');
    
     
    applySecurityControls(mocks.mockApp as any, mocks.mockWindow as any);
    
    expect(mocks.mockWindow.webContents.setWindowOpenHandler).toHaveBeenCalled();
    const handler = mocks.mockWindow.webContents.setWindowOpenHandler.mock.calls[0][0];
    
    const result = handler({ url: 'https://evil.com' });
    expect(result).toEqual({ action: 'deny' });
  });

  it('should block webview tag attachment', async () => {
    const { applySecurityControls } = await import('./security');
    
     
    applySecurityControls(mocks.mockApp as any, mocks.mockWindow as any);

    expect(mocks.mockApp.on).toHaveBeenCalledWith('web-contents-created', expect.any(Function));
    
     
    const onWebContentsCreated = mocks.mockApp.on.mock.calls.find((call: any[]) => call[0] === 'web-contents-created')?.[1];
    if (!onWebContentsCreated) throw new Error("Handler not found");
    
    const mockContents = {
      on: vi.fn()
    };
    
    onWebContentsCreated({}, mockContents);
    
    expect(mockContents.on).toHaveBeenCalledWith('will-attach-webview', expect.any(Function));
    
     
    const onWillAttachWebview = mockContents.on.mock.calls.find((call: any[]) => call[0] === 'will-attach-webview')?.[1];
    if (!onWillAttachWebview) throw new Error("Handler not found");
    
    const mockEvent = { preventDefault: vi.fn() };
    onWillAttachWebview(mockEvent);
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });
});
