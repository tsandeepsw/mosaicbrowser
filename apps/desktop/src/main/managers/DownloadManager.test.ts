import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloadManager } from './DownloadManager';
import * as path from 'path';
import * as fs from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('DownloadManager Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeFilename', () => {
    it('should strip path traversal characters', () => {
      expect(DownloadManager.sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(DownloadManager.sanitizeFilename('..\\..\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
      expect(DownloadManager.sanitizeFilename('/absolute/path/file.txt')).toBe('file.txt');
      expect(DownloadManager.sanitizeFilename('C:\\absolute\\path\\file.txt')).toBe('file.txt');
    });

    it('should strip special characters', () => {
      expect(DownloadManager.sanitizeFilename('file<name>.txt')).toBe('file_name_.txt');
      expect(DownloadManager.sanitizeFilename('file?name*.txt')).toBe('file_name_.txt');
      expect(DownloadManager.sanitizeFilename('file|name.txt')).toBe('file_name.txt');
      expect(DownloadManager.sanitizeFilename('file"name".txt')).toBe('file_name_.txt');
      expect(DownloadManager.sanitizeFilename('file:name.txt')).toBe('file_name.txt');
    });

    it('should handle pure dot segments gracefully', () => {
      expect(DownloadManager.sanitizeFilename('.')).toBe('downloaded_file');
      expect(DownloadManager.sanitizeFilename('..')).toBe('downloaded_file');
    });

    it('should truncate very long names', () => {
      const veryLongName = 'a'.repeat(300) + '.txt';
      const sanitized = DownloadManager.sanitizeFilename(veryLongName);
      expect(sanitized.length).toBeLessThan(200);
      expect(sanitized.endsWith('.txt')).toBe(true);
      expect(sanitized.startsWith('a'.repeat(150))).toBe(true);
    });

    it('should return default name for empty inputs', () => {
      expect(DownloadManager.sanitizeFilename('')).toBe('downloaded_file');
      expect(DownloadManager.sanitizeFilename('   ')).toBe('downloaded_file');
      expect(DownloadManager.sanitizeFilename(null as any)).toBe('downloaded_file');
    });
  });

  describe('Duplicate names', () => {
    it('should handle duplicate names by appending a counter', () => {
      // @ts-expect-error accessing private method
      const getUniquePath = DownloadManager.getUniquePath.bind(DownloadManager);
      
      const mockExistsSync = vi.mocked(fs.existsSync);
      
      // Simulate that the file exists twice, then the third attempt is free
      mockExistsSync.mockImplementationOnce(() => true);
      mockExistsSync.mockImplementationOnce(() => true);
      mockExistsSync.mockImplementationOnce(() => false);
      
      const basePath = path.join('/fake/downloads', 'file.txt');
      const uniquePath = getUniquePath(basePath);
      
      // Should end up as 'file (2).txt' since initial is file.txt, first dup is file (1).txt, second is file (2).txt
      expect(uniquePath).toBe(path.join('/fake/downloads', 'file (2).txt'));
    });
  });
});
