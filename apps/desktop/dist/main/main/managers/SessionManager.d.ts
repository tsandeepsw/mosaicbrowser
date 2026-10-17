import { Session } from 'electron';
export declare class SessionManager {
    static getIsolatedSession(partitionId: string): Session;
}
