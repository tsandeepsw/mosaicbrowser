import { z } from 'zod';
export const SitePreferenceSchema = z.object({
    urlPattern: z.string(),
    muted: z.boolean(),
    blockedPermissions: z.array(z.string()),
    zoomLevel: z.number(),
});
export const BrowserProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    icon: z.string(),
    preferences: z.array(SitePreferenceSchema),
});
export const PanelLayoutSchema = z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
});
export const WorkspacePanelSchema = z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    profileId: z.string().optional(),
    layout: PanelLayoutSchema.optional(),
});
export const WorkspaceSchema = z.object({
    id: z.string(),
    name: z.string(),
    panels: z.array(WorkspacePanelSchema),
    layoutType: z.enum(['1', '2x2', '3x2', '4x2', '4x4', 'custom']),
    maximizedPanelId: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
    isArchived: z.boolean(),
    isFavorite: z.boolean(),
    order: z.number(),
});
