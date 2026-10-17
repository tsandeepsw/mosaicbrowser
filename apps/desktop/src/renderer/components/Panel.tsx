
import React, { useRef, useEffect, useState } from 'react';
import '../styles/App.css';

export const Panel = ({
  panel,
  index,
  onRemove,
  onToggleMaximize: _onToggleMaximize,
  onProfileChange: _onProfileChange,
  onToggleMute,
  isMaximized: _isMaximized,
  viewState,
  isBookmarked,
  onToggleBookmark,
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [urlInput, setUrlInput] = useState(panel.url);
  const [shouldLoad, setShouldLoad] = useState(false);
  const initialUrlRef = useRef(panel.url);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, index * 200); // Progressive loading offset
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (viewState?.url && viewState.url !== urlInput) {
      setUrlInput(viewState.url);
    }
  }, [viewState?.url]);

  useEffect(() => {
    if (!shouldLoad) return;
    let lastRect = { x: -1, y: -1, width: -1, height: -1 };
    let frameId: number;

    let viewCreated = false;

    const checkBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Shrink the native view bounds slightly so it doesn't cover the resize handles on the edges
        const padding = 2;
        const newRect = {
          x: Math.round(rect.x) + padding,
          y: Math.round(rect.y),
          width: Math.round(rect.width) - (padding * 2),
          height: Math.round(rect.height) - padding,
        };

        if (
          newRect.x !== lastRect.x ||
          newRect.y !== lastRect.y ||
          newRect.width !== lastRect.width ||
          newRect.height !== lastRect.height
        ) {
          lastRect = newRect;
          if (!viewCreated) {
            window.electronAPI.view.create(panel.id, panel.profileId || 'default', initialUrlRef.current, newRect);
            viewCreated = true;
          } else {
            window.electronAPI.view.setBoundsSync(panel.id, newRect);
          }
        }
      }
      frameId = requestAnimationFrame(checkBounds);
    };

    frameId = requestAnimationFrame(checkBounds);

    return () => {
      cancelAnimationFrame(frameId);
      window.electronAPI.view.destroy(panel.id);
    };
  }, [panel.id, panel.profileId, shouldLoad]);

  useEffect(() => {
    if (shouldLoad) {
      window.electronAPI.view.setMuted(panel.id, !!panel.isMuted);
    }
  }, [panel.isMuted, shouldLoad]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = urlInput;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    window.electronAPI.view.navigate(panel.id, finalUrl);
  };

  return (
    <div className="panel-container">
      <div
        className="panel-header"
        onWheel={(e) => {
          if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        <div className="drag-handle" title="Drag to move panel">⠿</div>
        <button
          onClick={() => window.electronAPI.view.goBack(panel.id)}
          disabled={!viewState?.canGoBack}
          title="Go Back"
          className="nav-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI.view.goForward(panel.id)}
          disabled={!viewState?.canGoForward}
          title="Go Forward"
          className="nav-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI.view.reload(panel.id)}
          title="Reload"
          className="nav-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        <form
          onSubmit={handleNavigate}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ flex: 1, display: 'flex', minWidth: '120px', flexShrink: 0 }}
        >
          <input
            className="url-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onFocus={(e) => e.target.select()}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (document.activeElement !== e.currentTarget) {
                e.preventDefault();
                e.currentTarget.focus();
                e.currentTarget.select();
              }
            }}
          />
        </form>

        <button
          onClick={onToggleBookmark}
          title={isBookmarked ? "Remove Bookmark" : "Bookmark this website"}
          style={{ color: isBookmarked ? '#f5a623' : 'inherit' }}
        >
          {isBookmarked ? '★' : '☆'}
        </button>

        <button
          onClick={onToggleMute}
          title={panel.isMuted ? "Unmute" : "Mute"}
          style={{ color: panel.isMuted ? 'var(--danger)' : 'inherit' }}
        >
          {panel.isMuted ? '🔇' : '🔊'}
        </button>

        <button onClick={onRemove} title="Close" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</button>
      </div>

      {viewState?.isLoading && (
        <div style={{ height: '2px', backgroundColor: 'var(--accent)', width: '100%' }} />
      )}
      {viewState?.isCrashed && (
        <div style={{ padding: '10px', color: 'white', backgroundColor: 'var(--danger)' }}>
          Render process crashed!
        </div>
      )}

      {!shouldLoad ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Loading panel...
        </div>
      ) : (
        <div ref={containerRef} style={{ flex: 1 }} />
      )}
    </div>
  );
};
