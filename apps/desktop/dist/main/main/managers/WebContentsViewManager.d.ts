import { BaseWindow } from 'electron';
export interface ViewState {
    id: string;
    url: string;
    title: string;
    favicon: string;
    isLoading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    isCrashed: boolean;
}
export declare class WebContentsViewManager {
    readonly id: string;
    readonly partitionId: string;
    private onStateChange?;
    private view;
    state: ViewState;
    private sleepTimer;
    isBackground: boolean;
    private isMobileEmulationEnabled;
    constructor(id: string, partitionId: string, onStateChange?: ((state: ViewState) => void) | undefined);
    create(parentWindow: BaseWindow): void;
    setBackground(parentWindow: BaseWindow, background: boolean): void;
    navigate(url: string): Promise<void>;
    reload(): void;
    setBounds(bounds: Electron.Rectangle): void;
    focus(): void;
    destroy(parentWindow: BaseWindow): void;
}
