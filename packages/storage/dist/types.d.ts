import { z } from 'zod';
export declare const SitePreferenceSchema: z.ZodObject<{
    urlPattern: z.ZodString;
    muted: z.ZodBoolean;
    blockedPermissions: z.ZodArray<z.ZodString>;
    zoomLevel: z.ZodNumber;
}, z.core.$strip>;
export declare const BrowserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    color: z.ZodString;
    icon: z.ZodString;
    preferences: z.ZodArray<z.ZodObject<{
        urlPattern: z.ZodString;
        muted: z.ZodBoolean;
        blockedPermissions: z.ZodArray<z.ZodString>;
        zoomLevel: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const PanelLayoutSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    w: z.ZodNumber;
    h: z.ZodNumber;
}, z.core.$strip>;
export declare const WorkspacePanelSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    title: z.ZodString;
    profileId: z.ZodOptional<z.ZodString>;
    layout: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const WorkspaceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    panels: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        title: z.ZodString;
        profileId: z.ZodOptional<z.ZodString>;
        layout: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    layoutType: z.ZodEnum<{
        custom: "custom";
        1: "1";
        "2x2": "2x2";
        "3x2": "3x2";
        "4x2": "4x2";
        "4x4": "4x4";
    }>;
    maximizedPanelId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    isArchived: z.ZodBoolean;
    isFavorite: z.ZodBoolean;
    order: z.ZodNumber;
}, z.core.$strip>;
