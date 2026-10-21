import React from 'react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onNavigateAbout: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack, onNavigateAbout }) => {
  return (
    <div className="info-page-wrapper">
      {/* Top Navigation Bar */}
      <div className="info-page-topbar">
        <button onClick={onBack} className="info-back-btn" title="Return to Workspaces">
          <span style={{ fontSize: '16px', marginRight: '6px' }}>←</span> Back to Workspaces
        </button>
        <div className="info-topbar-links">
          <button onClick={onNavigateAbout} className="info-nav-link">
            About Mosaic →
          </button>
        </div>
      </div>

      <div className="info-page-content">
        {/* Hero Section */}
        <div className="info-hero">
          <div className="info-hero-logo">
            <div className="privacy-shield-icon">🛡️</div>
          </div>
          <h1 className="info-hero-title">Privacy Policy</h1>
          <p className="info-hero-subtitle">
            Mosaic is designed to minimize data collection. Mosaic does not intentionally collect personal information or browsing activity, and most application data remains stored locally on your device.
          </p>
          <div className="info-hero-badges">
            <span className="badge badge-success">No Analytics Tracking</span>
            <span className="badge badge-primary">Application Data Stored Locally</span>
            <span className="badge badge-accent">Isolated Profiles</span>
            <span className="badge badge-neutral">Last Updated: October 2026</span>
          </div>
        </div>

        {/* Guarantees Grid */}
        <h2 className="info-section-title">Core Privacy Guarantees</h2>
        <div className="info-features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>🚫</div>
            <h3>No Analytics Tracking</h3>
            <p>
              Mosaic has no analytics, tracking beacons, or telemetry servers. We do not log what websites you visit, what searches you perform, or how you configure your browser.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>💾</div>
            <h3>100% Local SQLite Storage</h3>
            <p>
              Your workspaces, panel layouts, window arrangements, and bookmarks are stored exclusively on your local machine in an embedded SQLite database. No external cloud sync is forced.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>🧱</div>
            <h3>Multi-Profile Partitioning</h3>
            <p>
              Different workspaces and panels can use independent session partitions. Cookies, local storage, indexedDB, and cache are completely isolated to prevent cross-site and cross-profile tracking.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>🛡️</div>
            <h3>Sandboxed Web Views</h3>
            <p>
              All websites run inside sandboxed Chromium renderer processes with strict context isolation. Web content cannot access your OS files, shell commands, or native Node.js APIs.
            </p>
          </div>
          <div className="feature-card">
            <div
              className="feature-icon"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24'
              }}
            >
              🔍
            </div>

            <h3>Open Source</h3>

            <p>
              Mosaic is an open-source project. The source code is publicly available for review,
              allowing anyone to inspect how the application works and verify its privacy and
              security practices.
            </p>
          </div>
          <div className="feature-card">
            <div
              className="feature-icon"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8'
              }}
            >
              🔎
            </div>

            <h3>Third-Party Search Providers</h3>

            <p>
              Searches performed through integrated search providers are processed according to
              the privacy policies and terms of those providers. Mosaic does not control how
              external websites handle user data.
            </p>
          </div>
        </div>

        {/* Policy Details */}
        <h2 className="info-section-title">Detailed Privacy Practices</h2>
        <div className="privacy-sections">
          <div className="privacy-section-card">
            <h3>1. Information We Do Not Collect</h3>
            <p>
              We do not collect personal identification information, IP addresses, geolocation data, browsing history, form autofill data, or keystrokes. Mosaic operates as a self-contained local application.
            </p>
          </div>

          <div className="privacy-section-card">
            <h3>2. Local Storage and Data Persistence</h3>
            <p>
              Data created within Mosaic is saved into your operating system's standard application data directory:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '8px 0', color: 'var(--text-primary)', fontSize: '0.95em' }}>
              <li><strong>Workspaces & Panels:</strong> Workspace data is stored locally on your device.</li>
              <li><strong>Bookmarks:</strong> Stored locally in the <code>bookmarks</code> table.</li>
              <li><strong>Downloads:</strong> Saved directly to your OS Downloads folder. Paths are sanitized to prevent directory traversal.</li>
            </ul>
          </div>

          <div className="privacy-section-card">
            <h3>3. Third-Party Websites & External Services</h3>
            <p>
              When you load web pages within Mosaic panels, those external websites (such as search engines or web apps) receive standard HTTP headers and cookies in accordance with web standards. To mitigate third-party tracker sharing, use separate partition IDs for different web accounts.
            </p>
          </div>

          <div className="privacy-section-card">
            <h3>4. Web Permissions & Hardware Access</h3>
            <p>
              Mosaic enforces strict permission boundaries. Access to hardware devices such as webcams, microphones, notifications, or geolocation is never granted silently. All permission requests must be explicitly permitted by the user or are blocked by default.
            </p>
          </div>

          <div className="privacy-section-card">
            <h3>5. How to Erase Your Data</h3>
            <p>
              You maintain total sovereignty over your data. You can delete individual workspaces, panels, or bookmarks directly from the interface at any time. To perform a complete factory reset, remove the Mosaic application data folder from your operating system's user directory.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="info-footer">
          <p className="info-copyright">Mosaic Privacy Policy • Commitment to user freedom and data integrity.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button onClick={onBack} className="btn-primary" style={{ padding: '8px 18px' }}>
              Return to Workspaces
            </button>
            <button onClick={onNavigateAbout} className="btn-secondary" style={{ padding: '8px 18px' }}>
              Learn About Mosaic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
