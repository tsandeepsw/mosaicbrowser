import React from 'react';
import mosaicIcon from '../assets/icon.png';

interface AboutPageProps {
  onBack: () => void;
  onNavigatePrivacy: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onNavigatePrivacy }) => {
  return (
    <div className="info-page-wrapper">
      {/* Top Navigation Bar */}
      <div className="info-page-topbar">
        <button onClick={onBack} className="info-back-btn" title="Return to Workspaces">
          <span style={{ fontSize: '16px', marginRight: '6px' }}>←</span> Back to Workspaces
        </button>
        <div className="info-topbar-links">
          <button onClick={onNavigatePrivacy} className="info-nav-link">
            Privacy Policy →
          </button>
        </div>
      </div>

      <div className="info-page-content">
        {/* Hero Section */}
        <div className="info-hero">
          <div className="info-hero-logo">
            <img src={mosaicIcon} alt="Mosaic Logo" className="mosaic-hero-img" />
          </div>
          <h1 className="info-hero-title">Mosaic</h1>
          <p className="info-hero-subtitle">
            A next-generation multi-panel workspace browser built for speed, privacy, and customizable split-view workflows.
          </p>
          <div className="info-hero-badges">
            <span className="badge badge-primary">Version 0.1.0</span>
            <span className="badge badge-accent">Electron & React</span>
            <span className="badge badge-neutral">100% Local & Private</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <h2 className="info-section-title">Core Capabilities</h2>
        <div className="info-features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>🗂️</div>
            <h3>Multi-Panel Workspaces</h3>
            <p>
              Organize multiple web apps and websites side-by-side. Seamlessly switch between Single, 2x2, 3x2, 4x2, and 4x4 grid layouts tailored to your multitasking needs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>🔒</div>
            <h3>Isolated Session Partitions</h3>
            <p>
              Run distinct accounts concurrently. Each panel can be assigned to an isolated profile partition, keeping cookies, local storage, and cache completely compartmentalized.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>⚡</div>
            <h3>Native WebContentsView</h3>
            <p>
              Leverages Electron WebContentsView for native hardware acceleration, fast rendering, and sandboxed process isolation without the overhead of heavy nested browser windows.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>★</div>
            <h3>Quick Bookmarks & Launch</h3>
            <p>
              Pin critical pages right to the workspace header. Launch new panel tiles with a single click, or manage your quick bookmarks bar anytime.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>🔇</div>
            <h3>Per-Panel Audio & Throttling</h3>
            <p>
              Quickly mute noisy tabs with a click. Background sleeping automatically throttles inactive views after 60 seconds to conserve battery and CPU resources.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>⌨️</div>
            <h3>Command Palette</h3>
            <p>
              Press <kbd>Cmd</kbd> + <kbd>K</kbd> (or <kbd>Ctrl</kbd> + <kbd>K</kbd>) to search across all workspaces, switch tabs, reload panels, and navigate without taking your hands off the keyboard.
            </p>
          </div>
        </div>

        {/* System & Architecture Info */}
        <h2 className="info-section-title">Technical Architecture</h2>
        <div className="info-tech-box">
          <div className="tech-item">
            <span className="tech-label">Architecture</span>
            <span className="tech-value">Electron + React + TypeScript Monorepo</span>
          </div>
          <div className="tech-item">
            <span className="tech-label">Local Storage</span>
            <span className="tech-value">Embedded SQLite with WAL Mode</span>
          </div>
          <div className="tech-item">
            <span className="tech-label">Process Security</span>
            <span className="tech-value">Context Isolation & Sandboxed Renderers</span>
          </div>
          <div className="tech-item">
            <span className="tech-label">Navigation & CSP</span>
            <span className="tech-value">Strict HTTPS-First Enforcement & Origin Filtering</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="info-footer">
          <p className="info-copyright">Mosaic Browser © 2026. Made for focused, productive web browsing.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button onClick={onBack} className="btn-primary" style={{ padding: '8px 18px' }}>
              Return to Workspaces
            </button>
            <button onClick={onNavigatePrivacy} className="btn-secondary" style={{ padding: '8px 18px' }}>
              Read Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
