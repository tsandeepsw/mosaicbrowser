export type WorkspaceId = string;
export type PanelId = string;
export type ProfileId = string;

export interface SitePreference {
  urlPattern: string;
  muted: boolean;
  blockedPermissions: string[];
  zoomLevel: number;
}

export interface BrowserProfile {
  id: ProfileId;
  name: string;
  color: string;
  icon: string;
  preferences: SitePreference[];
}

export interface PanelLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorkspacePanel {
  id: PanelId;
  url: string;
  title: string;
  profileId?: ProfileId;
  layout?: PanelLayout;
}

export type LayoutType = '1' | '2x2' | '3x2' | '4x2' | '4x4' | 'custom';

export interface Workspace {
  id: WorkspaceId;
  name: string;
  panels: WorkspacePanel[];
  layoutType: LayoutType;
  maximizedPanelId?: PanelId;
  createdAt: number;
  updatedAt: number;
  isArchived: boolean;
  isFavorite: boolean;
  order: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
}
