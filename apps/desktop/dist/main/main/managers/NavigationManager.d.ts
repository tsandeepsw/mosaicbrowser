import { WebContents } from 'electron';
export declare class NavigationManager {
    static readonly ALLOWED_SCHEMES: string[];
    static isValidUrl(urlStr: string): boolean;
    static enforceHttpsFirst(urlStr: string): string;
    static apply(webContents: WebContents): void;
}
