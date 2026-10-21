
import React, { useState, useEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './styles/App.css';
import { Panel } from './components/Panel';
import { getLayoutPreset } from './utils/LayoutEngine';
import { CommandPalette } from './components/CommandPalette';
import { AboutPage } from './components/AboutPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import mosaicIcon from './assets/icon.png';

export const App = () => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'workspace' | 'about' | 'privacy'>('workspace');
  const [viewStates, setViewStates] = useState<Record<string, any>>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [bookmarks, setBookmarks] = useState<Array<{ id: string; url: string; title: string }>>([]);
  const [showBookmarkOverflow, setShowBookmarkOverflow] = useState(false);
  const [bookmarksOverflowing, setBookmarksOverflowing] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const hasInitialized = useRef(false);
  const createWorkspaceRef = useRef<() => void>(() => { });
  const addSiteRef = useRef<(url?: string) => void>(() => { });
  const workspacesRef = useRef(workspaces);
  workspacesRef.current = workspaces;
  const activeWorkspaceIdRef = useRef(activeWorkspaceId);
  activeWorkspaceIdRef.current = activeWorkspaceId;
  const bookmarksBarRef = useRef<HTMLDivElement>(null);
  const overflowDropdownRef = useRef<HTMLDivElement>(null);
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const lastClosedTimeRef = useRef(0);
  const hasNativeDropdown = typeof window !== 'undefined' && Boolean(window.electronAPI?.bookmarks?.showDropdown);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    window.electronAPI.storage.getAllWorkspaces().then((loaded) => {
      if (loaded && loaded.length > 0) {
        // Migrate any existing 'Default' workspace to 'Workspace 1'
        const migrated = loaded.map((w: any) => {
          if (w.name === 'Default') {
            const updated = { ...w, name: 'Workspace 1' };
            window.electronAPI.storage.saveWorkspace(updated);
            return updated;
          }
          return w;
        });
        setWorkspaces(migrated);
        const savedActive = localStorage.getItem('activeWorkspaceId');
        setActiveWorkspaceId(savedActive && migrated.find((w: any) => w.id === savedActive) ? savedActive : migrated[0].id);
      } else {
        const defaultWs = {
          id: `w${Date.now()}`,
          name: 'Workspace 1',
          panels: [],
          layoutType: '1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isArchived: false,
          isFavorite: false,
          order: 0
        };
        setWorkspaces([defaultWs]);
        setActiveWorkspaceId(defaultWs.id);
        localStorage.setItem('activeWorkspaceId', defaultWs.id);
        window.electronAPI.storage.saveWorkspace(defaultWs);
      }
    });

    window.electronAPI.app?.onNavigate?.((page: string) => {
      if (page === 'about' || page === 'privacy' || page === 'workspace') {
        setCurrentPage(page as any);
      }
    });

    window.electronAPI.app?.onNewWorkspace?.(() => {
      createWorkspaceRef.current?.();
    });

    window.electronAPI.app?.onOpenUrlInNewPanel?.((url: string) => {
      addSiteRef.current?.(url);
    });

    window.electronAPI.storage.getBookmarks?.().then((loadedBookmarks: any[]) => {
      if (loadedBookmarks && Array.isArray(loadedBookmarks)) {
        setBookmarks(loadedBookmarks);
      }
    });

    window.electronAPI.bookmarks?.onUpdated?.(() => {
      window.electronAPI.storage.getBookmarks?.().then((loadedBookmarks: any[]) => {
        if (loadedBookmarks && Array.isArray(loadedBookmarks)) {
          setBookmarks(loadedBookmarks);
        }
      });
    });

    window.electronAPI.bookmarks?.onDropdownClosed?.(() => {
      lastClosedTimeRef.current = Date.now();
      setShowBookmarkOverflow(false);
    });

    window.electronAPI.view.onStateChanged((state) => {
      setViewStates((prev) => ({ ...prev, [state.id]: state }));
    });

    window.electronAPI.notification.onReceived((notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 100));
    });

    window.electronAPI.notification.onClicked((_notif) => {
      // Handled below
    });
  }, []);

  // Sync URLs to workspaces
  useEffect(() => {
    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
    if (!activeWorkspace) return;

    let changed = false;
    const updatedPanels = activeWorkspace.panels.map((p: any) => {
      const state = viewStates[p.id];
      if (state && state.url && state.url !== p.url) {
        changed = true;
        return { ...p, url: state.url };
      }
      return p;
    });

    if (changed) {
      const updated = { ...activeWorkspace, panels: updatedPanels };
      saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
    }
  }, [viewStates]);

  useEffect(() => {
    window.electronAPI.notification.onClicked((notif) => {
      const targetWorkspace = workspaces.find((w) => w.panels.some((p: any) => p.id === notif.panelId));
      if (targetWorkspace) {
        setActiveWorkspaceId(targetWorkspace.id);
      } else {
        console.warn('Workspace or panel no longer exists for notification', notif);
      }
    });
  }, [workspaces]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect bookmarks bar overflow to show/hide the chevron button
  useEffect(() => {
    const bar = bookmarksBarRef.current;
    if (!bar) return;
    let rafId: number;
    const checkOverflow = () => {
      // Defer to next frame so the browser has finished laying out chips
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!bar.isConnected) return;
        setBookmarksOverflowing(bar.scrollWidth > bar.clientWidth);
      });
    };
    checkOverflow();
    // Watch the bar itself resize (e.g. window resize shrinks the header)
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(bar);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [bookmarks, currentPage]);

  // Close overflow dropdown when clicking outside or scrolling/resizing/Escape
  useEffect(() => {
    if (!showBookmarkOverflow) return;
    const close = (e: MouseEvent) => {
      // Don't close if click is inside the dropdown or on the chevron button itself
      const inDropdown = overflowDropdownRef.current?.contains(e.target as Node);
      const inBtn = overflowBtnRef.current?.contains(e.target as Node);
      if (!inDropdown && !inBtn) {
        setShowBookmarkOverflow(false);
        window.electronAPI.bookmarks?.closeDropdown?.();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowBookmarkOverflow(false);
        window.electronAPI.bookmarks?.closeDropdown?.();
      }
    };
    const dismiss = () => {
      setShowBookmarkOverflow(false);
      window.electronAPI.bookmarks?.closeDropdown?.();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [showBookmarkOverflow]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const saveAndSetWorkspaces = (newWorkspaces: any[]) => {
    setWorkspaces(newWorkspaces);
    newWorkspaces.forEach((w) => window.electronAPI.storage.saveWorkspace(w));
  };

  const createWorkspace = () => {
    let nextNum = workspaces.length + 1;
    const existingNums = workspaces
      .map((w: any) => {
        const match = w.name?.match(/^Workspace\s+(\d+)$/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n: any): n is number => n !== null);
    if (existingNums.length > 0) {
      nextNum = Math.max(...existingNums) + 1;
    }
    const newWs = {
      id: `w${Date.now()}`,
      name: `Workspace ${nextNum}`,
      panels: [],
      layoutType: '2-column',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isArchived: false,
      isFavorite: false,
      order: workspaces.length
    };
    saveAndSetWorkspaces([...workspaces, newWs]);
    setActiveWorkspaceId(newWs.id);
    localStorage.setItem('activeWorkspaceId', newWs.id);
    setCurrentPage('workspace');
  };

  createWorkspaceRef.current = createWorkspace;

  const addSite = (url: string = 'https://www.search.yahoo.com/') => {
    console.log('Adding site:', url);
    const allWorkspaces = workspacesRef.current;
    const currentActiveId = activeWorkspaceIdRef.current;
    const targetWorkspace = allWorkspaces.find((w) => w.id === currentActiveId) || allWorkspaces[0];
    if (!targetWorkspace) return;
    if (targetWorkspace.panels.length >= 8) {
      alert('Max 8 panels supported for now');
      return;
    }
    const newPanel: any = { id: `p${Date.now()}`, url, profileId: 'default', isMuted: false };

    // Add offset for new panels so they don't exactly stack
    if (targetWorkspace.panels.length > 0) {
      const lastPanel = targetWorkspace.panels[targetWorkspace.panels.length - 1];
      const lastLayout = lastPanel.layout || { x: 0, y: 0, w: 6, h: 6 };

      let nextX = lastLayout.x + lastLayout.w;
      let nextY = lastLayout.y;

      if (nextX + lastLayout.w > 12) {
        nextX = 0;
        nextY += lastLayout.h;
      }

      newPanel.layout = {
        x: nextX,
        y: nextY,
        w: lastLayout.w,
        h: lastLayout.h
      };
    } else {
      newPanel.layout = { x: 0, y: 0, w: 6, h: 6 };
    }

    const updated = { ...targetWorkspace, panels: [...targetWorkspace.panels, newPanel] };
    saveAndSetWorkspaces(allWorkspaces.map((w) => (w.id === targetWorkspace.id ? updated : w)));
    setCurrentPage('workspace');
  };

  addSiteRef.current = addSite;

  const updatePanelProfile = (panelId: string, profileId: string) => {
    if (!activeWorkspace) return;
    const updatedPanels = activeWorkspace.panels.map((p: any) =>
      p.id === panelId ? { ...p, profileId } : p
    );
    const updated = { ...activeWorkspace, panels: updatedPanels };
    saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
  };

  const togglePanelMute = (panelId: string) => {
    if (!activeWorkspace) return;
    const updatedPanels = activeWorkspace.panels.map((p: any) => {
      if (p.id === panelId) {
        const isMuted = !p.isMuted;
        window.electronAPI.view.setMuted(panelId, isMuted);
        return { ...p, isMuted };
      }
      return p;
    });
    const updated = { ...activeWorkspace, panels: updatedPanels };
    saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
  };

  const removeSite = (panelId: string) => {
    if (!activeWorkspace) return;
    const updated = {
      ...activeWorkspace,
      panels: activeWorkspace.panels.filter((p: any) => p.id !== panelId),
      maximizedPanelId: activeWorkspace.maximizedPanelId === panelId ? undefined : activeWorkspace.maximizedPanelId
    };
    saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
  };

  const changeLayout = (layoutType: string) => {
    if (!activeWorkspace) return;
    const updated = { ...activeWorkspace, layoutType };
    saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
  };

  const toggleMaximize = (panelId: string) => {
    if (!activeWorkspace) return;
    const isCurrentlyMaximized = activeWorkspace.maximizedPanelId === panelId;
    const updated = { ...activeWorkspace, maximizedPanelId: isCurrentlyMaximized ? undefined : panelId };
    saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
  };

  const onLayoutChange = (layout: any) => {
    if (!activeWorkspace) return;
    // Map layout back to panels
    const layoutMap: Record<string, any> = {};
    layout.forEach((l: any) => {
      layoutMap[l.i] = { x: l.x, y: l.y, w: l.w, h: l.h };
    });

    const updatedPanels = activeWorkspace.panels.map((p: any) => ({
      ...p,
      layout: layoutMap[p.id] || p.layout
    }));

    const updated = { ...activeWorkspace, panels: updatedPanels };
    saveAndSetWorkspaces(workspaces.map((w) => (w.id === activeWorkspaceId ? updated : w)));
  };

  const toggleBookmark = async (panel: any) => {
    const currentUrl = viewStates[panel.id]?.url || panel.url || 'https://www.google.com';
    let currentTitle = viewStates[panel.id]?.title || panel.title;
    if (!currentTitle || currentTitle.trim() === '') {
      try {
        currentTitle = new URL(currentUrl).hostname.replace(/^www\./, '');
      } catch {
        currentTitle = 'Bookmark';
      }
    }

    const existing = bookmarks.find((b) => b.url === currentUrl);
    if (existing) {
      await window.electronAPI.storage.deleteBookmark(existing.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      const newBookmark = {
        id: `bm_${Date.now()}`,
        url: currentUrl,
        title: currentTitle,
      };
      await window.electronAPI.storage.saveBookmark(newBookmark.id, newBookmark.url, newBookmark.title);
      setBookmarks((prev) => [...prev, newBookmark]);
    }
  };

  const deleteBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await window.electronAPI.storage.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  if (!activeWorkspace) return <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '20px' }}>Loading...</div>;

  const currentLayoutMap: Record<string, any> = {};
  activeWorkspace.panels.forEach((p: any) => {
    if (p.layout) currentLayoutMap[p.id] = p.layout;
  });

  const generatedLayout = getLayoutPreset(activeWorkspace.layoutType, activeWorkspace.panels.length, currentLayoutMap);
  const gridLayout = activeWorkspace.panels.map((p: any, idx: number) => {
    let l: any;
    if (activeWorkspace.layoutType === 'custom') {
      l = generatedLayout.find((lyt: any) => lyt.i === p.id) || p.layout || { x: (idx * 2) % 12, y: Math.floor(idx / 2) * 6, w: 6, h: 4 };
    } else {
      l = generatedLayout[idx] || { x: (idx * 2) % 12, y: Math.floor(idx / 2) * 6, w: 6, h: 4 };
    }
    return { i: p.id, x: l.x, y: l.y, w: l.w, h: l.h };
  });

  const GridLayoutComponent = GridLayout as any;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '200px', flexShrink: 0, backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', userSelect: 'none' }}>
        {/* Brand Header */}
        <div
          onClick={() => setCurrentPage('workspace')}
          style={{
            padding: '14px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          title="Mosaic Browser"
        >
          <img src={mosaicIcon} alt="Mosaic" className="mosaic-sidebar-img" />
          <div>
            <div style={{
              fontSize: '1.15em',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              lineHeight: 1.1
            }}>
              Mosaic
            </div>
            <div style={{ fontSize: '0.68em', color: '#888888', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Browser
            </div>
          </div>
        </div>

        {/* Workspaces Section */}
        <div style={{ padding: '12px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.75em', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Workspaces
          </span>
          <span style={{ fontSize: '0.72em', color: '#888888', background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: '10px' }}>
            {workspaces.length}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {workspaces.map((w) => (
            <div
              key={w.id}
              className={`sidebar-item ${currentPage === 'workspace' && w.id === activeWorkspaceId ? 'active' : ''}`}
              onClick={() => {
                setActiveWorkspaceId(w.id);
                localStorage.setItem('activeWorkspaceId', w.id);
                setCurrentPage('workspace');
              }}
            >
              {w.name}
            </div>
          ))}
        </div>

        <div style={{ padding: '10px 14px' }}>
          <button onClick={createWorkspace} className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '13px', justifyContent: 'center' }}>
            + New Workspace
          </button>
        </div>

        {/* Sidebar Footer: About & Privacy */}
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '6px 4px 10px' }}>
          <div
            className={`sidebar-footer-item ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => { setShowBookmarkOverflow(false); setCurrentPage('about'); }}
            title="About Mosaic"
          >
            <span>ℹ️</span>
            <span>About Mosaic</span>
          </div>
          <div
            className={`sidebar-footer-item ${currentPage === 'privacy' ? 'active' : ''}`}
            onClick={() => { setShowBookmarkOverflow(false); setCurrentPage('privacy'); }}
            title="Privacy Policy"
          >
            <span>🛡️</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      {currentPage === 'about' ? (
        <AboutPage
          onBack={() => setCurrentPage('workspace')}
          onNavigatePrivacy={() => setCurrentPage('privacy')}
        />
      ) : currentPage === 'privacy' ? (
        <PrivacyPolicyPage
          onBack={() => setCurrentPage('workspace')}
          onNavigateAbout={() => setCurrentPage('about')}
        />
      ) : (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
          {/* Header — overflow:hidden + minWidth:0 prevent the row from growing past the window width */}
          <div style={{ width: '100%', boxSizing: 'border-box', padding: '5px 5px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, overflow: 'hidden', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
              <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{activeWorkspace.name}</div>
              <select
                value={activeWorkspace.layoutType}
                onChange={(e) => changeLayout(e.target.value)}
                className="profile-select"
              >
                <option value="1">Single</option>
                <option value="2x2">2x2 Grid</option>
                <option value="3x2">3x2 Grid</option>
                <option value="4x2">4x2 Grid</option>
                <option value="4x4">4x4 Grid</option>
                {/* <option value="custom">Custom</option> */}
              </select>
            </div>

            {/* Bookmarks section: chips and chevron button */}
            <div className="header-bookmarks-section">
              <div className="header-bookmarks-bar" ref={bookmarksBarRef}>
                {bookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="bookmark-chip"
                    onClick={() => { addSite(b.url); setShowBookmarkOverflow(false); }}
                    title={`${b.title}\n${b.url} (Click to open in new panel)`}
                  >
                    <span className="bookmark-icon">★</span>
                    <span className="bookmark-title">{b.title}</span>
                    <span
                      className="bookmark-delete"
                      onClick={(e) => deleteBookmark(b.id, e)}
                      title="Remove Bookmark"
                    >
                      ✕
                    </span>
                  </div>
                ))}
              </div>

              {bookmarksOverflowing && (
                <button
                  ref={overflowBtnRef}
                  className="bookmarks-overflow-btn"
                  onClick={() => {
                    if (Date.now() - lastClosedTimeRef.current < 200) {
                      return;
                    }
                    if (showBookmarkOverflow) {
                      setShowBookmarkOverflow(false);
                      window.electronAPI.bookmarks?.closeDropdown?.();
                    } else {
                      const rect = overflowBtnRef.current!.getBoundingClientRect();
                      setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                      setShowBookmarkOverflow(true);
                      window.electronAPI.bookmarks?.showDropdown?.({
                        x: Math.round(rect.right - 280),
                        y: Math.round(rect.bottom + 6),
                        width: 280,
                        bookmarks,
                      });
                    }
                  }}
                  title="Show all bookmarks"
                  aria-label="Show all bookmarks"
                  aria-expanded={showBookmarkOverflow}
                >
                  ⌄
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ position: 'relative', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }} title="Notifications">
                🔔
                {notifications.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{notifications.length}</span>}
              </button>
              <button onClick={() => addSite()} className="btn-primary">
                Add Site
              </button>
            </div>
          </div>

          {/* Overflow dropdown - rendered in DOM only if native Electron overlay dropdown is not available */}
          {showBookmarkOverflow && !hasNativeDropdown && dropdownPos && (
            <div
              ref={overflowDropdownRef}
              className="bookmarks-overflow-dropdown"
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
            >
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="bookmarks-overflow-item"
                  onClick={() => { addSite(b.url); setShowBookmarkOverflow(false); }}
                  title={b.url}
                >
                  <span className="bookmark-icon">★</span>
                  <span className="bookmarks-overflow-item-title">{b.title}</span>
                  <span
                    className="bookmark-delete"
                    onClick={(e) => { deleteBookmark(b.id, e); }}
                    title="Remove Bookmark"
                  >
                    ✕
                  </span>
                </div>
              ))}
            </div>
          )}



          {/* Panel Container */}
          <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
            <GridLayoutComponent
              className="layout"
              layout={gridLayout}
              cols={12}
              rowHeight={Math.floor((window.innerHeight - 20) / 12) - 10}
              width={window.innerWidth - 200}
              onLayoutChange={onLayoutChange}
              draggableHandle=".drag-handle"
              draggableCancel="input,textarea,button,select"
              resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
              margin={[4, 4]}
              style={{ height: '90%' }}
            >
              {activeWorkspace.panels.map((p: any, idx: number) => {
                const isMaximized = activeWorkspace.maximizedPanelId === p.id;
                const isHidden = activeWorkspace.maximizedPanelId && !isMaximized;
                const currentUrl = viewStates[p.id]?.url || p.url;
                const isBookmarked = bookmarks.some((b) => b.url === currentUrl);

                return (
                  <div key={p.id} style={
                    isMaximized ?
                      { position: 'relative', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }
                      : isHidden ?
                        { display: 'none' }
                        : {}
                  }>
                    <Panel
                      panel={p}
                      index={idx}
                      onRemove={() => removeSite(p.id)}
                      onToggleMaximize={() => toggleMaximize(p.id)}
                      onProfileChange={(profileId: string) => updatePanelProfile(p.id, profileId)}
                      onToggleMute={() => togglePanelMute(p.id)}
                      isMaximized={isMaximized}
                      viewState={viewStates[p.id]}
                      isBookmarked={isBookmarked}
                      onToggleBookmark={() => toggleBookmark(p)}
                    />
                  </div>
                );
              })}
            </GridLayoutComponent>

            {activeWorkspace.panels.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Empty Workspace. Click "Add Site" to begin.
              </div>
            )}

            {showNotifications && (
              <div style={{ position: 'absolute', top: 10, right: 10, width: '320px', maxHeight: '400px', overflowY: 'auto', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Notifications
                  <button onClick={() => { setNotifications([]); setShowNotifications(false); }} style={{ fontSize: '0.85em', padding: '4px 8px' }}>Clear all</button>
                </div>
                {notifications.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No notifications</div> : null}
                {notifications.map(n => (
                  <div key={n.id}
                    onClick={() => {
                      const targetWorkspace = workspaces.find((w) => w.panels.some((p: any) => p.id === n.panelId));
                      if (targetWorkspace) {
                        setActiveWorkspaceId(targetWorkspace.id);
                        setCurrentPage('workspace');
                        setShowNotifications(false);
                      }
                    }}
                    style={{ padding: '10px', borderBottom: '1px solid #333', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8em', color: '#ccc' }}>{n.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSwitchWorkspace={(id) => {
          setActiveWorkspaceId(id);
          setCurrentPage('workspace');
        }}
        onOpenSite={(url) => addSite(url)}
        onFocusPanel={(id) => window.electronAPI.view.focus(id)}
        onMaximizePanel={(id) => { if (activeWorkspace.maximizedPanelId !== id) toggleMaximize(id); }}
        onRestorePanel={(id) => { if (activeWorkspace.maximizedPanelId === id) toggleMaximize(id); }}
        onReloadPanel={(id) => window.electronAPI.view.reload(id)}
        onClosePanel={(id) => removeSite(id)}
        onSleepPanel={(id) => window.electronAPI.view.background(id)}
        onWakePanel={(id) => {
          const p = activeWorkspace.panels.find((panel: any) => panel.id === id);
          if (p) {
            const layout = currentLayoutMap[id];
            if (layout) {
              window.electronAPI.view.create(id, p.profileId || 'default', p.url, { x: 0, y: 0, width: 100, height: 100 });
            }
          }
        }}
        onOpenExternal={(url) => window.electronAPI.shell.openExternal(url)}
        onNavigatePage={(page) => setCurrentPage(page)}
      />
    </div>
  );
};
