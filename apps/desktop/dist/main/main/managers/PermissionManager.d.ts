import { Session } from 'electron';
export declare class PermissionManager {
    private static permissions;
    static grant(origin: string, permission: string): void;
    static deny(origin: string, permission: string): void;
    static apply(session: Session): void;
}
