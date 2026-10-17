import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShellManager } from './ShellManager';
import { shell } from 'electron';

vi.mock('electron', () => ({
  shell: {
    openExternal: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('ShellManager Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openExternal', () => {
    it('should allow https urls', async () => {
      const result = await ShellManager.openExternal('https://example.com/path?q=1');
      expect(result).toBe(true);
      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com/path?q=1');
    });

    it('should allow http urls', async () => {
      const result = await ShellManager.openExternal('http://example.com/');
      expect(result).toBe(true);
      expect(shell.openExternal).toHaveBeenCalledWith('http://example.com/');
    });

    it('should block javascript: urls', async () => {
      const result = await ShellManager.openExternal('javascript:alert(1)');
      expect(result).toBe(false);
      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should block data: urls', async () => {
      const result = await ShellManager.openExternal('data:text/html,<h1>hi</h1>');
      expect(result).toBe(false);
      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should block file: urls', async () => {
      const result = await ShellManager.openExternal('file:///etc/passwd');
      expect(result).toBe(false);
      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should block custom protocols', async () => {
      const result = await ShellManager.openExternal('custom://app/start');
      expect(result).toBe(false);
      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should block malformed URLs', async () => {
      const result = await ShellManager.openExternal('not_a_url');
      expect(result).toBe(false);
      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('should block command injection attempts via arguments', async () => {
      // The URL constructor should fail or encode these, preventing argument injection
      const result = await ShellManager.openExternal('https://example.com/ --no-sandbox');
      expect(result).toBe(true);
      // The spaces should be URL encoded by the URL constructor
      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com/%20--no-sandbox');
    });
  });
});
