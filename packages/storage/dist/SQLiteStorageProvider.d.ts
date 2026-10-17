import { IStorageProvider, StorageResult } from './IStorageProvider.js';
import { Workspace, BrowserProfile } from '@workspacebrowser/types';
export declare class SQLiteStorageProvider implements IStorageProvider {
    private dbPath;
    private db;
    constructor(dbPath?: string);
    initialize(): void;
    close(): void;
    private runMigrations;
    transaction<T>(block: () => T): StorageResult<T>;
    saveWorkspace(workspace: Workspace): StorageResult<void>;
    getWorkspace(id: string): StorageResult<Workspace | null>;
    getAllWorkspaces(): StorageResult<Workspace[]>;
    deleteWorkspace(id: string): StorageResult<void>;
    saveProfile(profile: BrowserProfile): StorageResult<void>;
    getProfile(id: string): StorageResult<BrowserProfile | null>;
    saveSetting(key: string, value: string): StorageResult<void>;
    getSetting(key: string): StorageResult<string | null>;
    saveBookmark(id: string, url: string, title: string): StorageResult<void>;
    getBookmarks(): StorageResult<Array<{
        id: string;
        url: string;
        title: string;
    }>>;
    deleteBookmark(id: string): StorageResult<void>;
}
