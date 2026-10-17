 
import Database, { Database as DBType } from 'better-sqlite3';
import { IStorageProvider, StorageResult } from './IStorageProvider.js';
import { Workspace, BrowserProfile } from '@workspacebrowser/types';
import { WorkspaceSchema, BrowserProfileSchema } from './types.js';

export class SQLiteStorageProvider implements IStorageProvider {
  private db: DBType | null = null;

  constructor(private dbPath: string = ':memory:') {}

  public initialize(): void {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.runMigrations();
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private runMigrations(): void {
    if (!this.db) throw new Error("DB not initialized");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT NOT NULL
      );
    `);
  }

  public transaction<T>(block: () => T): StorageResult<T> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    
    try {
      const tx = this.db.transaction(block);
      const result = tx();
      return { success: true, data: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public saveWorkspace(workspace: Workspace): StorageResult<void> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    
    try {
      WorkspaceSchema.parse(workspace);
      const stmt = this.db.prepare('INSERT OR REPLACE INTO workspaces (id, data) VALUES (?, ?)');
      stmt.run(workspace.id, JSON.stringify(workspace));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getWorkspace(id: string): StorageResult<Workspace | null> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    
    try {
      const stmt = this.db.prepare('SELECT data FROM workspaces WHERE id = ?');
      const row = stmt.get(id) as { data: string } | undefined;
      if (!row) return { success: true, data: null };
      
      const workspace = JSON.parse(row.data) as Workspace;
      WorkspaceSchema.parse(workspace);
      return { success: true, data: workspace };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getAllWorkspaces(): StorageResult<Workspace[]> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    
    try {
      const stmt = this.db.prepare('SELECT data FROM workspaces');
      const rows = stmt.all() as { data: string }[];
      
      const workspaces: Workspace[] = [];
      for (const row of rows) {
        const workspace = JSON.parse(row.data) as Workspace;
        WorkspaceSchema.parse(workspace);
        workspaces.push(workspace);
      }
      return { success: true, data: workspaces };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public deleteWorkspace(id: string): StorageResult<void> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('DELETE FROM workspaces WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public saveProfile(profile: BrowserProfile): StorageResult<void> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      BrowserProfileSchema.parse(profile);
      const stmt = this.db.prepare('INSERT OR REPLACE INTO profiles (id, data) VALUES (?, ?)');
      stmt.run(profile.id, JSON.stringify(profile));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getProfile(id: string): StorageResult<BrowserProfile | null> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('SELECT data FROM profiles WHERE id = ?');
      const row = stmt.get(id) as { data: string } | undefined;
      if (!row) return { success: true, data: null };
      
      const profile = JSON.parse(row.data) as BrowserProfile;
      BrowserProfileSchema.parse(profile);
      return { success: true, data: profile };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public saveSetting(key: string, value: string): StorageResult<void> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run(key, value);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getSetting(key: string): StorageResult<string | null> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
      const row = stmt.get(key) as { value: string } | undefined;
      if (!row) return { success: true, data: null };
      return { success: true, data: row.value };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public saveBookmark(id: string, url: string, title: string): StorageResult<void> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO bookmarks (id, url, title) VALUES (?, ?, ?)');
      stmt.run(id, url, title);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getBookmarks(): StorageResult<Array<{id: string, url: string, title: string}>> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('SELECT id, url, title FROM bookmarks');
      const rows = stmt.all() as { id: string, url: string, title: string }[];
      return { success: true, data: rows };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public deleteBookmark(id: string): StorageResult<void> {
    if (!this.db) return { success: false, error: "DB not initialized" };
    try {
      const stmt = this.db.prepare('DELETE FROM bookmarks WHERE id = ?');
      stmt.run(id);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

