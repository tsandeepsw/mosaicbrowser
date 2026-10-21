 
export {};

declare module '*.png' {
  const content: string;
  export default content;
}

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>;
      view: {
        create: (id: string, partitionId: string, url: string, bounds: any) => Promise<void>;
        destroy: (id: string) => Promise<void>;
        setBounds: (id: string, bounds: any) => Promise<void>;
        setBoundsSync: (id: string, bounds: any) => void;
        navigate: (id: string, url: string) => Promise<void>;
        goBack: (id: string) => Promise<void>;
        goForward: (id: string) => Promise<void>;
        reload: (id: string) => Promise<void>;
        focus: (id: string) => Promise<void>;
        setMuted: (id: string, isMuted: boolean) => Promise<void>;
        background: (id: string) => Promise<void>;
        setVisible?: (id: string, visible: boolean) => Promise<void>;
        setVisibleAll?: (visible: boolean) => Promise<void>;
        onStateChanged: (callback: (state: any) => void) => void;
      };
      shell: {
        openExternal: (url: string) => Promise<void>;
      };
      storage: {
        getAllWorkspaces: () => Promise<any[]>;
        saveWorkspace: (workspace: any) => Promise<void>;
        deleteWorkspace: (id: string) => Promise<void>;
        getBookmarks: () => Promise<Array<{ id: string; url: string; title: string }>>;
        saveBookmark: (id: string, url: string, title: string) => Promise<void>;
        deleteBookmark: (id: string) => Promise<void>;
      };
      bookmarks?: {
        showDropdown: (data: { x: number; y: number; width: number; bookmarks: any[] }) => Promise<void>;
        closeDropdown: () => Promise<void>;
        onDropdownClosed: (callback: () => void) => void;
        onUpdated: (callback: () => void) => void;
      };
      permission: {
        grant: (origin: string, permission: string) => Promise<void>;
        deny: (origin: string, permission: string) => Promise<void>;
      };
      notification: {
        getAll: () => Promise<any[]>;
        clear: () => Promise<void>;
        onReceived: (callback: (notif: any) => void) => void;
        onClicked: (callback: (notif: any) => void) => void;
      };
      download: {
        getAll: () => Promise<any[]>;
        cancel: (id: string) => Promise<void>;
        open: (id: string) => Promise<void>;
        reveal: (id: string) => Promise<void>;
        clearCompleted: () => Promise<void>;
        onUpdated: (callback: (state: any) => void) => void;
      };
      app: {
        onNavigate: (callback: (page: string) => void) => void;
        onNewWorkspace: (callback: () => void) => void;
        onOpenUrlInNewPanel?: (callback: (url: string) => void) => void;
      };
    };
  }
}
