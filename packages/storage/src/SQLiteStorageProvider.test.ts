 
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteStorageProvider } from './SQLiteStorageProvider';
import { Workspace, BrowserProfile } from '@workspacebrowser/types';

describe('SQLiteStorageProvider', () => {
  let provider: SQLiteStorageProvider;

  beforeEach(() => {
    provider = new SQLiteStorageProvider(':memory:');
    provider.initialize();
  });

  afterEach(() => {
    provider.close();
  });

  it('should initialize and run migrations', () => {
    expect(() => provider.initialize()).not.toThrow();
  });

  describe('Workspaces', () => {
    const mockWorkspace: Workspace = {
      id: 'ws1',
      name: 'Test Workspace',
      panels: [
        {
          id: 'p1',
          url: 'https://example.com',
          title: 'Example',
        }
      ],
      createdAt: 123456,
      updatedAt: 123456,
      isArchived: false,
      isFavorite: false,
      layoutType: '1',
      order: 0,
    };

    it('should create and read a workspace', () => {
      const saveRes = provider.saveWorkspace(mockWorkspace);
      expect(saveRes.success).toBe(true);

      const getRes = provider.getWorkspace('ws1');
      expect(getRes.success).toBe(true);
      expect(getRes.data).toEqual(mockWorkspace);
    });

    it('should update a workspace', () => {
      provider.saveWorkspace(mockWorkspace);
      const updated = { ...mockWorkspace, name: 'Updated Name' };
      provider.saveWorkspace(updated);

      const getRes = provider.getWorkspace('ws1');
      expect(getRes.data?.name).toBe('Updated Name');
    });

    it('should delete a workspace', () => {
      provider.saveWorkspace(mockWorkspace);
      const delRes = provider.deleteWorkspace('ws1');
      expect(delRes.success).toBe(true);

      const getRes = provider.getWorkspace('ws1');
      expect(getRes.data).toBe(null);
    });

    it('should return null for non-existent workspace', () => {
      const getRes = provider.getWorkspace('ws99');
      expect(getRes.data).toBe(null);
    });

    it('should fail schema validation for invalid data', () => {
      const invalidWorkspace = { ...mockWorkspace, name: 123 } as any;
      const saveRes = provider.saveWorkspace(invalidWorkspace);
      expect(saveRes.success).toBe(false);
      expect(saveRes.error).toContain('expected string, received number');
    });
  });

  describe('Profiles', () => {
    const mockProfile: BrowserProfile = {
      id: 'prof1',
      name: 'Default',
      color: '#fff',
      icon: 'star',
      preferences: [
        {
          urlPattern: '*.example.com',
          muted: true,
          blockedPermissions: ['camera'],
          zoomLevel: 1.2,
        }
      ]
    };

    it('should create and read a profile', () => {
      provider.saveProfile(mockProfile);
      const getRes = provider.getProfile('prof1');
      expect(getRes.data).toEqual(mockProfile);
    });
  });

  describe('Transactions', () => {
    it('should rollback on error', () => {
      const mockWorkspace: Workspace = {
        id: 'tx1', name: 'Tx', panels: [], createdAt: 0, updatedAt: 0, isArchived: false, isFavorite: false, order: 0, layoutType: '1'
      };

      const txRes = provider.transaction(() => {
        provider.saveWorkspace(mockWorkspace);
        throw new Error('Abort transaction');
      });

      expect(txRes.success).toBe(false);
      expect(txRes.error).toBe('Abort transaction');

      const getRes = provider.getWorkspace('tx1');
      expect(getRes.data).toBe(null);
    });

    it('should commit on success', () => {
      const mockWorkspace: Workspace = {
        id: 'tx2', name: 'Tx2', panels: [], createdAt: 0, updatedAt: 0, isArchived: false, isFavorite: false, order: 0, layoutType: '1'
      };

      const txRes = provider.transaction(() => {
        provider.saveWorkspace(mockWorkspace);
        return 'success';
      });

      expect(txRes.success).toBe(true);
      expect(txRes.data).toBe('success');

      const getRes = provider.getWorkspace('tx2');
      expect(getRes.data).toEqual(mockWorkspace);
    });
  });

  describe('Bookmarks', () => {
    it('should save and read bookmarks', () => {
      const saveRes = provider.saveBookmark('bm1', 'https://github.com', 'GitHub');
      expect(saveRes.success).toBe(true);

      const getRes = provider.getBookmarks();
      expect(getRes.success).toBe(true);
      expect(getRes.data).toEqual([{ id: 'bm1', url: 'https://github.com', title: 'GitHub' }]);
    });

    it('should delete a bookmark', () => {
      provider.saveBookmark('bm1', 'https://github.com', 'GitHub');
      const delRes = provider.deleteBookmark('bm1');
      expect(delRes.success).toBe(true);

      const getRes = provider.getBookmarks();
      expect(getRes.data).toEqual([]);
    });
  });
});

