import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Globe, 
  Shield, 
  Sparkles, 
  Cpu, 
  Award, 
  BookOpen,
  Moon,
  Sun,
  History,
  Command,
  Search,
  Check,
  Trash2,
  Lock,
  Layers,
  ArrowRight,
  Monitor
} from 'lucide-react';
import { LOR_LOGO } from '../assets/logoBase64';

export type SettingsTabId = 'appearance' | 'history' | 'shortcuts' | 'about';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
  isPrivate?: boolean;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  searchEngine: string;
  onSearchEngineChange: (engine: string) => void;
  historyCount: number;
  onClearHistory: () => void;
  onOpenFullHistory: () => void;
  onReplayOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'appearance',
  isPrivate = false,
  theme,
  onThemeChange,
  searchEngine,
  onSearchEngineChange,
  historyCount,
  onClearHistory,
  onOpenFullHistory,
  onReplayOnboarding
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [historyClearedNotice, setHistoryClearedNotice] = useState(false);

  // Sync initial tab when opening modal
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleOpenLinkedIn = () => {
    const url = 'https://www.linkedin.com/in/tylertan0/';
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleConfirmClear = () => {
    onClearHistory();
    setClearingHistory(false);
    setHistoryClearedNotice(true);
    setTimeout(() => setHistoryClearedNotice(false), 2500);
  };

  return (
    <div className="history-modal-backdrop" onClick={onClose}>
      <div 
        className="settings-modal-box" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <header className="settings-modal-topbar">
          <div className="settings-header-brand">
            <img src={LOR_LOGO} alt="Lor Logo" className="settings-header-logo" />
            <span className="settings-header-title">Settings & Preferences</span>
            <span className="settings-header-badge">Lor v0.1.0</span>
          </div>

          <button className="history-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </header>

        {/* Modal Body: Left Tab Sidebar + Right Tab Content */}
        <div className="settings-modal-body">
          {/* Navigation Sidebar */}
          <nav className="settings-nav-sidebar">
            <button
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Sun size={15} />
              <span>Appearance</span>
            </button>

            <button
              className={`settings-nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={15} />
              <span>History & Sync</span>
            </button>

            <button
              className={`settings-nav-item ${activeTab === 'shortcuts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shortcuts')}
            >
              <Command size={15} />
              <span>Shortcuts</span>
            </button>

            <button
              className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <Sparkles size={15} />
              <span>About Lor</span>
            </button>
          </nav>

          {/* Tab Content Panes */}
          <main className="settings-tab-content">
            {/* 1. APPEARANCE & GENERAL */}
            {activeTab === 'appearance' && (
              <div className="settings-pane">
                <div className="settings-pane-header">
                  <h3>Appearance & Interface</h3>
                  <p>Personalize Lor's liquid glass design system and browsing preferences.</p>
                </div>

                {/* Theme Selector */}
                <div className="settings-section">
                  <label className="settings-section-label">Color Theme</label>
                  <div className="settings-theme-grid">
                    {/* Dark Theme Card */}
                    <div 
                      className={`theme-card ${theme === 'dark' ? 'selected' : ''}`}
                      onClick={() => onThemeChange('dark')}
                    >
                      <div className="theme-card-preview dark-preview">
                        <div className="mock-window-dots">
                          <span /><span /><span />
                        </div>
                        <div className="mock-sidebar-strip" />
                        <div className="mock-card-fill" />
                      </div>
                      <div className="theme-card-info">
                        <div className="theme-name-row">
                          <Moon size={14} />
                          <span className="theme-name">Obsidian Dark</span>
                        </div>
                        <span className="theme-desc">Pure monochrome liquid glass with deep contrast.</span>
                      </div>
                      {theme === 'dark' && <div className="theme-check-badge"><Check size={12} /></div>}
                    </div>

                    {/* Light Theme Card */}
                    <div 
                      className={`theme-card ${theme === 'light' ? 'selected' : ''}`}
                      onClick={() => onThemeChange('light')}
                    >
                      <div className="theme-card-preview light-preview">
                        <div className="mock-window-dots">
                          <span /><span /><span />
                        </div>
                        <div className="mock-sidebar-strip" />
                        <div className="mock-card-fill" />
                      </div>
                      <div className="theme-card-info">
                        <div className="theme-name-row">
                          <Sun size={14} />
                          <span className="theme-name">Porcelain Light</span>
                        </div>
                        <span className="theme-desc">Crisp, high-clarity daylight interface for bright spaces.</span>
                      </div>
                      {theme === 'light' && <div className="theme-check-badge"><Check size={12} /></div>}
                    </div>
                  </div>
                </div>

                {/* Default Search Engine */}
                <div className="settings-section">
                  <label className="settings-section-label">Default Search Engine</label>
                  <p className="settings-subtext">Used when typing non-URL queries into the Omnibox or address pill.</p>
                  <div className="settings-search-options">
                    {[
                      { id: 'google', name: 'Google Search', icon: '🔍', desc: 'Default engine with live Google Suggest' },
                      { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆', desc: 'Privacy-first search' },
                      { id: 'ecosia', name: 'Ecosia', icon: '🌱', desc: 'Plant trees with searches' },
                      { id: 'bing', name: 'Microsoft Bing', icon: '⚡', desc: 'Bing web index' }
                    ].map((engine) => (
                      <div 
                        key={engine.id}
                        className={`settings-radio-row ${searchEngine === engine.id ? 'active' : ''}`}
                        onClick={() => onSearchEngineChange(engine.id)}
                      >
                        <div className="radio-dot-wrap">
                          <div className={`radio-dot ${searchEngine === engine.id ? 'checked' : ''}`} />
                        </div>
                        <div className="radio-text">
                          <div className="radio-title-line">
                            <span className="radio-icon">{engine.icon}</span>
                            <span className="radio-title">{engine.name}</span>
                          </div>
                          <span className="radio-desc">{engine.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Onboarding Replay */}
                <div className="settings-section">
                  <label className="settings-section-label">Onboarding Lore</label>
                  <div className="settings-action-card">
                    <div className="settings-action-info">
                      <Sparkles size={16} />
                      <div>
                        <strong>Interactive Welcome Walkthrough</strong>
                        <p>Re-experience the 5-chapter journey covering Spaces, Dual Split, and Sovereign sync.</p>
                      </div>
                    </div>
                    <button 
                      className="settings-action-btn secondary"
                      onClick={() => {
                        onClose();
                        onReplayOnboarding();
                      }}
                    >
                      <span>Replay Lore</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. HISTORY & SOVEREIGN ARCHIVE */}
            {activeTab === 'history' && (
              <div className="settings-pane">
                <div className="settings-pane-header">
                  <h3>History & Sovereign Archive</h3>
                  <p>{isPrivate ? 'History features are completely disabled in Private Windows.' : 'Lor connects directly to your local Chrome profile with zero telemetry.'}</p>
                </div>

                {isPrivate ? (
                  <div className="settings-section">
                    <label className="settings-section-label">Incognito Blank Slate</label>
                    <div className="history-status-card" style={{ borderColor: 'rgba(255, 255, 255, 0.18)' }}>
                      <div className="history-status-top">
                        <div className="history-status-indicator active">
                          <Shield size={16} color="#ffffff" />
                          <span className="status-label" style={{ fontWeight: 700 }}>Private Window • Absolute Blank Slate</span>
                        </div>
                        <span className="history-badge-sqlite">Ephemeral RAM</span>
                      </div>
                      <p className="history-status-desc">
                        In this Private Window, all history features are cut off. Lor runs inside an isolated in-memory sandbox. No visited URLs are tracked, Chrome SQLite sync is disconnected, and session cookies are destroyed upon closing this window.
                      </p>
                      <div className="history-metrics-row">
                        <div className="metric-box">
                          <span className="metric-num">0</span>
                          <span className="metric-label">History Recorded</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-num">Off</span>
                          <span className="metric-label">Chrome SQLite Sync</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-num">RAM Only</span>
                          <span className="metric-label">Isolated Session</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Google Chrome Sync Status */}
                <div className="settings-section">
                  <label className="settings-section-label">Google Chrome SQLite Bridge</label>
                  <div className="history-status-card">
                    <div className="history-status-top">
                      <div className="history-status-indicator active">
                        <span className="pulse-dot" />
                        <span className="status-label">Active & Synchronized</span>
                      </div>
                      <span className="history-badge-sqlite">SQLite Lock-Free</span>
                    </div>
                    <p className="history-status-desc">
                      Lor creates a non-blocking shadow copy of your Chrome database (`~/Library/Application Support/Google/Chrome/Default/History`). Your active Google Account history and omnibox completions query seamlessly without locking Chrome.
                    </p>
                    <div className="history-metrics-row">
                      <div className="metric-box">
                        <span className="metric-num">Local</span>
                        <span className="metric-label">Data Storage</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-num">0</span>
                        <span className="metric-label">Network Telemetry</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-num">{historyCount}</span>
                        <span className="metric-label">Lor Visited URLs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Quick Actions */}
                <div className="settings-section">
                  <label className="settings-section-label">Archive Management</label>
                  
                  <div className="settings-action-card" style={{ marginBottom: 12 }}>
                    <div className="settings-action-info">
                      <History size={16} />
                      <div>
                        <strong>Full Archive Browser (Cmd+Y)</strong>
                        <p>Search, filter, and inspect your unified Chrome & Lor browsing timeline.</p>
                      </div>
                    </div>
                    <button 
                      className="settings-action-btn primary"
                      onClick={() => {
                        onClose();
                        onOpenFullHistory();
                      }}
                    >
                      <span>Open Archive</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="settings-action-card danger">
                    <div className="settings-action-info">
                      <Trash2 size={16} />
                      <div>
                        <strong>Clear Lor Local History</strong>
                        <p>Purges the in-memory and local session history recorded by Lor spaces.</p>
                      </div>
                    </div>
                    {clearingHistory ? (
                      <div className="confirm-row">
                        <span className="confirm-label">Are you sure?</span>
                        <button className="confirm-btn danger" onClick={handleConfirmClear}>
                          Yes, Clear
                        </button>
                        <button className="confirm-btn cancel" onClick={() => setClearingHistory(false)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="settings-action-btn danger"
                        onClick={() => setClearingHistory(true)}
                      >
                        <Trash2 size={13} />
                        <span>Clear History</span>
                      </button>
                    )}
                  </div>

                  {historyClearedNotice && (
                    <div className="history-cleared-toast">
                      <Check size={14} />
                      <span>Lor browsing history cleared successfully.</span>
                    </div>
                  )}
                </div>

                {/* Privacy & Anti-Bot Protection */}
                <div className="settings-section">
                  <label className="settings-section-label">Security & Authentication</label>
                  <div className="security-shield-card">
                    <div className="shield-row">
                      <Shield size={16} color="#10b981" />
                      <div>
                        <strong>Chrome Bot Evasion & Stealth Headers</strong>
                        <p>Eliminates `navigator.webdriver` flags and matches genuine Chrome headers so Google Account login works without "This browser or app may not be secure" blockers.</p>
                      </div>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {/* 3. KEYBOARD SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="settings-pane">
                <div className="settings-pane-header">
                  <h3>Keyboard Shortcuts</h3>
                  <p>Master Lor with fluid keystrokes designed for continuous flow.</p>
                </div>

                <div className="shortcuts-category-group">
                  <h4 className="shortcuts-category-title">Navigation & Tabs</h4>
                  <div className="shortcuts-table">
                    <div className="shortcut-row">
                      <span className="shortcut-desc">New Tab</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>T</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Close Current Tab</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>W</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Focus Omnibox / Search Address</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>L</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Navigate Page Back / Forward</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>[</kbd> / <kbd>⌘</kbd><kbd>]</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Reload / Hard Reload</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>R</kbd> / <kbd>⌘</kbd><kbd>⇧</kbd><kbd>R</kbd></div>
                    </div>
                  </div>

                  <h4 className="shortcuts-category-title">Spatial & Multitasking</h4>
                  <div className="shortcuts-table">
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Split Screen (Dual Viewport)</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>S</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">1:1 Fluid Trackpad Back/Forward Swipe</span>
                      <span className="shortcut-gesture">Two-finger horizontal glide</span>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Switch Space via Trackpad</span>
                      <span className="shortcut-gesture">Two-finger swipe in sidebar</span>
                    </div>
                  </div>

                  <h4 className="shortcuts-category-title">System & Tools</h4>
                  <div className="shortcuts-table">
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Settings & Preferences</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>,</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">History Archive (Lor + Chrome)</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>Y</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">Downloads Manager</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>J</kbd></div>
                    </div>
                    <div className="shortcut-row">
                      <span className="shortcut-desc">New Incognito Window</span>
                      <div className="keycap-group"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>N</kbd></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ABOUT LOR (TYLER TAN CREATOR SPOTLIGHT) */}
            {activeTab === 'about' && (
              <div className="settings-pane">
                <div className="about-tab-hero">
                  <div className="about-tab-brand">
                    <img src={LOR_LOGO} alt="Lor Logo" className="about-hero-logo" />
                    <div>
                      <h2 className="about-hero-title">Lor Browser</h2>
                      <span className="about-hero-version">Version 0.1.0 • Artisanal Release</span>
                    </div>
                  </div>

                  {/* Creator Spotlight */}
                  <div className="creator-spotlight-card">
                    <div className="creator-badge-top">
                      <Award size={13} color="#f59e0b" />
                      <span>Conceived & Engineered by Tyler Tan</span>
                    </div>

                    <h3 className="creator-card-headline">Artisanal Software for the Curious Mind</h3>
                    
                    <p className="creator-card-body">
                      "Lor was built with a belief that the software we look at for hours each day should possess calmness, taste, and soul. Every edge swipe, every pixel of liquid glass, and every database query was written to serve you—uncluttered, private, and fast."
                    </p>

                    <div className="creator-footer-row">
                      <span className="creator-byline">— Tyler Tan, Software Architect & Product Designer</span>
                      <button className="creator-linkedin-btn" onClick={handleOpenLinkedIn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        <span>Connect on LinkedIn</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Architecture Grid */}
                  <div className="about-principles-grid">
                    <div className="principle-card">
                      <BookOpen size={16} />
                      <h4>World Wide Lore</h4>
                      <p>Inspired by the grand historical archives of human thought. Built to celebrate knowledge without noise.</p>
                    </div>
                    <div className="principle-card">
                      <Cpu size={16} />
                      <h4>Bicameral Sight</h4>
                      <p>Parallel dual viewports with zero alt-tab fatigue. Cross-reference research and build concurrently.</p>
                    </div>
                    <div className="principle-card">
                      <Shield size={16} />
                      <h4>Local Sovereignty</h4>
                      <p>Offline Google Chrome database sync, zero network telemetry, and native process sandboxing.</p>
                    </div>
                  </div>

                  {/* Replay Onboarding */}
                  <div className="about-replay-strip">
                    <button 
                      className="about-replay-link" 
                      onClick={() => {
                        onClose();
                        onReplayOnboarding();
                      }}
                    >
                      <Sparkles size={13} />
                      <span>Replay Lor Onboarding Walkthrough</span>
                    </button>

                    <span className="about-copyright-text">
                      © {new Date().getFullYear()} Tyler Tan. All rights reserved.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
