# Mosaic Browser

A high-performance, multi-panel desktop browser built with **Electron**, **React**, and **TypeScript**. Workspace Browser enables users to organize web applications into persistent, customizable workspaces with side-by-side multi-view layouts and isolated session contexts.

---

## Key Features

- **Multi-Panel Workspace Layouts**: Tile websites side-by-side with presets (Single, 2x2 Grid, 3x2 Grid, 4x2 Grid, 4x4 Grid) or freely resize panels via drag handles.
- **Native WebContentsView Engine**: Renders websites using native Chromium `WebContentsView` instances positioned over the React shell for superior security and native web compatibility compared to `<iframe>` or `<webview>`.
- **Session Isolation**: Supports isolated session partitions (`persist:<id>`) per workspace, preventing cross-site cookie and cache leakage.
- **Persistent Storage**: Robust SQLite datastore with WAL mode and schema validation using Zod for workspaces, panel configurations, and user profiles.
- **Security-First Architecture**:
  - `contextIsolation` enabled with Node.js strictly forbidden from web contexts.
  - Granular IPC validation for view bounds, navigation events, and external URLs.
  - Defensive window open and external protocol handlers.
- **Command Palette & Shortcuts**: Quick keyboard-driven workspace switching and layout changes.

---

## Architecture Overview

Workspace Browser is structured as an npm monorepo with clear separation between OS-level browser orchestration and UI components:

```
mosaicbrowser/
├── apps/desktop/src/
│   ├── main/                       # 🖥️ Electron Main Process (OS & Node.js Environment)
│   │   ├── index.ts                # Application lifecycle entry point
│   │   ├── ipc.ts                  # IPC Event Router (bridges renderer requests to managers)
│   │   ├── security.ts             # Security controls & permission policies
│   │   ├── security.test.ts        # Security test suite
│   └── managers/                   # OS & Browser Service Managers
│       ├── WebContentsViewManager.ts # Manages native Chromium web views
│       ├── SessionManager.ts         # Partition & cookie isolation (work vs personal)
│       ├── DownloadManager.ts        # Safe file downloads & path sanitization
│       ├── NotificationManager.ts    # Native desktop notifications
│       ├── PermissionManager.ts      # Hardware & API permission handler (camera, mic)
│       ├── NavigationManager.ts      # URL navigation validator & HTTPS enforcer
│       ├── ShellManager.ts           # Safe external browser URL launcher
│       └── *.test.ts                 # Manager unit tests
│    ├──preload/                    # 🛡️ Secure Context Bridge (Sandboxed Isolation)
│    ├── index.ts                    # Exposes window.electronAPI to the React window
│    └── viewPreload.ts              # Injected into embedded web panels for safe title/notification hooks
│    └── renderer/                   # 🎨 Renderer Process (Standard React 19 Frontend)
│    ├── index.html                  # HTML entry page
│    ├── index.tsx                   # Mounts React to the DOM
│    ├── App.tsx                     # Main layout shell & workspace orchestrator
│    ├── components/                 # Reusable React UI Components
│    ├── Panel.tsx                   # Individual panel frame (address bar, navigation buttons)
│    └── CommandPalette.tsx          # Quick action modal (Cmd+K / Ctrl+K search & switch)
│    ├── utils/                      # Helper Algorithms & Pure Calculations
│    ├── LayoutEngine.ts             # Grid layout math (1x1, 2x2, 3x2 coordinate calculations)
│    └── LayoutEngine.test.ts        # Layout math unit tests
│    ├── styles/                     # CSS & Theme Styling
│    └── App.css                     # Dark theme, grid styles, and animations
│    └── types/                      # Frontend Type Definitions
│    └── types.d.ts                  # Strongly types window.electronAPI for React autocomplete
├──package.json                     # Root monorepo workspace configuration
├── tsconfig.json                   # Monorepo TypeScript configuration
└── vitest.config.mjs               # Test runner configuration
```

### Process Communication Flow

1. **Renderer (React)**: Calculates panel coordinates on the grid and requests the Main process to mount or update native web views via `window.electronAPI.view.*`.
2. **Preload Bridge**: Exposes strictly typed and sanitized IPC invocations to the renderer without granting direct Node.js or Electron access.
3. **Main Process**: `WebContentsViewManager` handles Chromium view creation, lifecycle teardown, hardware-accelerated positioning, and audio muting.
4. **Storage Layer**: Workspaces, layouts, and profile metadata are persisted locally via `@workspacebrowser/storage`.

---

## Tech Stack

- **Runtime**: Electron 41
- **UI Framework**: React 19, TypeScript
- **Bundler**: Vite 8
- **Database**: SQLite (`better-sqlite3`), Zod
- **Testing**: Vitest, Playwright

---

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher

### Installation

Clone the repository and install all dependencies:

```bash
npm install
```

### Running the Application

To compile the packages and launch the Electron application:

```bash
npm start
```

### Available Scripts

| Script | Description |
|---|---|
| `npm start` | Builds packages and launches the Electron application |
| `npm run build` | Compiles all packages and bundles renderer and main process code |
| `npm test` | Runs the unit and integration test suite |
| `npm run test:e2e` | Runs Playwright end-to-end tests against the Electron app |
| `npm run lint` | Runs ESLint across all packages and apps |
| `npm run typecheck` | Validates TypeScript types across the monorepo |

---

## License

ISC
