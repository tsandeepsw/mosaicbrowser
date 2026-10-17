import Database from 'better-sqlite3';
import { WorkspaceSchema, BrowserProfileSchema } from './types.js';
export class SQLiteStorageProvider {
    dbPath;
    db = null;
    constructor(dbPath = ':memory:') {
        this.dbPath = dbPath;
    }
    initialize() {
        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.runMigrations();
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    runMigrations() {
        if (!this.db)
            throw new Error("DB not initialized");
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
    transaction(block) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const tx = this.db.transaction(block);
            const result = tx();
            return { success: true, data: result };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    saveWorkspace(workspace) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            WorkspaceSchema.parse(workspace);
            const stmt = this.db.prepare('INSERT OR REPLACE INTO workspaces (id, data) VALUES (?, ?)');
            stmt.run(workspace.id, JSON.stringify(workspace));
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    getWorkspace(id) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('SELECT data FROM workspaces WHERE id = ?');
            const row = stmt.get(id);
            if (!row)
                return { success: true, data: null };
            const workspace = JSON.parse(row.data);
            WorkspaceSchema.parse(workspace);
            return { success: true, data: workspace };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    getAllWorkspaces() {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('SELECT data FROM workspaces');
            const rows = stmt.all();
            const workspaces = [];
            for (const row of rows) {
                const workspace = JSON.parse(row.data);
                WorkspaceSchema.parse(workspace);
                workspaces.push(workspace);
            }
            return { success: true, data: workspaces };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    deleteWorkspace(id) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('DELETE FROM workspaces WHERE id = ?');
            stmt.run(id);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    saveProfile(profile) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            BrowserProfileSchema.parse(profile);
            const stmt = this.db.prepare('INSERT OR REPLACE INTO profiles (id, data) VALUES (?, ?)');
            stmt.run(profile.id, JSON.stringify(profile));
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    getProfile(id) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('SELECT data FROM profiles WHERE id = ?');
            const row = stmt.get(id);
            if (!row)
                return { success: true, data: null };
            const profile = JSON.parse(row.data);
            BrowserProfileSchema.parse(profile);
            return { success: true, data: profile };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    saveSetting(key, value) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
            stmt.run(key, value);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    getSetting(key) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
            const row = stmt.get(key);
            if (!row)
                return { success: true, data: null };
            return { success: true, data: row.value };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    saveBookmark(id, url, title) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('INSERT OR REPLACE INTO bookmarks (id, url, title) VALUES (?, ?, ?)');
            stmt.run(id, url, title);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    getBookmarks() {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('SELECT id, url, title FROM bookmarks');
            const rows = stmt.all();
            return { success: true, data: rows };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    deleteBookmark(id) {
        if (!this.db)
            return { success: false, error: "DB not initialized" };
        try {
            const stmt = this.db.prepare('DELETE FROM bookmarks WHERE id = ?');
            stmt.run(id);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
}
