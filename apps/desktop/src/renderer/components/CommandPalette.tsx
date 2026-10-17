import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: any[];
  activeWorkspaceId: string | null;
  onSwitchWorkspace: (id: string) => void;
  onOpenSite: (url: string) => void;
  onFocusPanel: (id: string) => void;
  onMaximizePanel: (id: string) => void;
  onRestorePanel: (id: string) => void;
  onReloadPanel: (id: string) => void;
  onClosePanel: (id: string) => void;
  onSleepPanel: (id: string) => void;
  onWakePanel: (id: string) => void;
  onOpenExternal: (url: string) => void;
  onNavigatePage?: (page: 'about' | 'privacy') => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen, onClose, workspaces, activeWorkspaceId,
  onSwitchWorkspace, onOpenSite, onFocusPanel,
  onMaximizePanel, onRestorePanel, onReloadPanel,
  onClosePanel, onSleepPanel, onWakePanel, onOpenExternal,
  onNavigatePage
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const activePanels = activeWorkspace?.panels || [];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [];

  // Navigation commands
  if (onNavigatePage) {
    commands.push({
      id: 'nav-about',
      title: 'About Mosaic',
      subtitle: 'View features, version, and architecture',
      action: () => {
        onNavigatePage('about');
        onClose();
      }
    });
    commands.push({
      id: 'nav-privacy',
      title: 'Privacy Policy',
      subtitle: 'View local data privacy and security guarantees',
      action: () => {
        onNavigatePage('privacy');
        onClose();
      }
    });
  }

  // Switch Workspace commands
  workspaces.forEach(w => {
    if (w.id !== activeWorkspaceId) {
      commands.push({
        id: `switch-workspace-${w.id}`,
        title: `Switch to Workspace: ${w.name}`,
        action: () => onSwitchWorkspace(w.id)
      });
    }
  });

  // Open site
  if (query.match(/^https?:\/\//)) {
    commands.push({
      id: `open-site`,
      title: `Open Site: ${query}`,
      action: () => onOpenSite(query)
    });
    
    commands.push({
      id: `open-external`,
      title: `Open in External Browser: ${query}`,
      action: () => onOpenExternal(query)
    });
  }

  // Panel commands (for active workspace panels)
  activePanels.forEach((p: any) => {
    const siteName = p.url || p.id;
    
    commands.push({
      id: `focus-${p.id}`,
      title: `Focus: ${siteName}`,
      action: () => onFocusPanel(p.id)
    });
    commands.push({
      id: `reload-${p.id}`,
      title: `Reload: ${siteName}`,
      action: () => onReloadPanel(p.id)
    });
    commands.push({
      id: `close-${p.id}`,
      title: `Close: ${siteName}`,
      action: () => onClosePanel(p.id)
    });
    
    if (activeWorkspace.maximizedPanelId === p.id) {
      commands.push({
        id: `restore-${p.id}`,
        title: `Restore: ${siteName}`,
        action: () => onRestorePanel(p.id)
      });
    } else {
      commands.push({
        id: `maximize-${p.id}`,
        title: `Maximize: ${siteName}`,
        action: () => onMaximizePanel(p.id)
      });
    }
    
    // Sleep/Wake
    commands.push({
      id: `sleep-${p.id}`,
      title: `Sleep: ${siteName}`,
      action: () => onSleepPanel(p.id)
    });
    commands.push({
      id: `wake-${p.id}`,
      title: `Wake: ${siteName}`,
      action: () => onWakePanel(p.id)
    });
  });

  // Search History / Bookmarks placeholders
  commands.push({
    id: 'search-history',
    title: 'Search History...',
    subtitle: 'Not yet implemented',
    action: () => {}
  });
  
  commands.push({
    id: 'search-bookmarks',
    title: 'Search Bookmarks...',
    subtitle: 'Not yet implemented',
    action: () => {}
  });

  const fuse = new Fuse(commands, {
    keys: ['title', 'subtitle'],
    threshold: 0.4
  });

  let results = commands;
  if (query && !query.match(/^https?:\/\//)) {
    results = fuse.search(query).map(r => r.item);
  } else if (query.match(/^https?:\/\//)) {
    // If it's a URL, prioritize open site
    results = commands.filter(c => c.id === 'open-site' || c.id === 'open-external');
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh',
      zIndex: 9999
    }} onClick={onClose}>
      <div 
        style={{
          width: '600px',
          backgroundColor: '#252526',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command or search..."
          style={{
            padding: '16px',
            fontSize: '1.2em',
            border: 'none',
            borderBottom: '1px solid #333',
            backgroundColor: 'transparent',
            color: 'white',
            outline: 'none'
          }}
        />
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>No results found</div>
          ) : (
            results.map((item, index) => (
              <div
                key={item.id}
                onClick={() => { item.action(); onClose(); }}
                style={{
                  padding: '12px 16px',
                  backgroundColor: index === selectedIndex ? '#094771' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span style={{ color: 'white' }}>{item.title}</span>
                {item.subtitle && <span style={{ fontSize: '0.8em', color: '#aaa' }}>{item.subtitle}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
