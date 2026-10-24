import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ExternalLink, 
  X,
  Compass,
  Columns2,
  History,
  Layers,
  Sparkles,
  Search,
  Cpu,
  Snowflake,
  PanelLeftClose,
  Code2,
  Palette,
  BookOpen,
  Feather,
  Sun,
  Zap,
  Moon
} from 'lucide-react';
import { LOR_LOGO } from '../assets/logoBase64';
import { JupiterIcon } from './SpaceSwitcher';
import { Space } from '../types/browser';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
  onUpdateSpaces?: (spaces: Space[]) => void;
}

type Archetype = 'engineering' | 'design' | 'research' | 'calm';
type Rhythm = 'morning' | 'focus' | 'night';
type TabStyle = 'hoarder' | 'minimalist';

const ARCHETYPE_CONFIG: Record<Archetype, { label: string; icon: any; desc: string; spaces: string[] }> = {
  engineering: {
    label: 'Engineering & Code',
    icon: Code2,
    desc: 'Compilers, GitHub, ArXiv, telemetry, and technical documentation.',
    spaces: ['Personal', 'Engineering', 'Research']
  },
  design: {
    label: 'Design & Vision',
    icon: Palette,
    desc: 'Figma, typography, liquid glass interactions, and visual inspiration.',
    spaces: ['Personal', 'Studio', 'Inspiration']
  },
  research: {
    label: 'Deep Research & Writing',
    icon: BookOpen,
    desc: 'Papers, philosophy, long-form essays, and knowledge archives.',
    spaces: ['Personal', 'Literature', 'Drafts']
  },
  calm: {
    label: 'Calm Sanctuary',
    icon: Feather,
    desc: 'Minimalist mindful browsing, serene essays, and quiet discovery.',
    spaces: ['Personal', 'Morning', 'Harbor']
  }
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenAbout,
  onUpdateSpaces
}) => {
  const [slideIndex, setSlideIndex] = useState(0);

  // User Profile State
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('lor_user_name') || '');
  const [archetype, setArchetype] = useState<Archetype>(() => (localStorage.getItem('lor_user_archetype') as Archetype) || 'engineering');
  const [rhythm, setRhythm] = useState<Rhythm>(() => (localStorage.getItem('lor_user_rhythm') as Rhythm) || 'focus');
  const [tabStyle, setTabStyle] = useState<TabStyle>(() => (localStorage.getItem('lor_user_tab_style') as TabStyle) || 'hoarder');
  
  // Interactive preview state for Slide 2 & Slide 3
  const [activePreviewSpaceIndex, setActivePreviewSpaceIndex] = useState(0);
  const [testVaultQuery, setTestVaultQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSlideIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Enter if user is typing in the name input on slide 0
      if (e.target instanceof HTMLInputElement && e.key !== 'Escape') {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinish();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slideIndex, userName, archetype, rhythm, tabStyle]);

  if (!isOpen) return null;

  const totalSlides = 5;
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === totalSlides - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('lor_onboarding_v2_completed', 'true');
      localStorage.setItem('lor_user_name', userName.trim());
      localStorage.setItem('lor_user_archetype', archetype);
      localStorage.setItem('lor_user_rhythm', rhythm);
      localStorage.setItem('lor_user_tab_style', tabStyle);

      // Tailor default spaces to chosen archetype
      const spaceNames = ARCHETYPE_CONFIG[archetype].spaces;
      const tailoredSpaces: Space[] = spaceNames.map((name, i) => ({
        id: `space-${name.toLowerCase()}-${i}`,
        name,
        themeColor: '#ffffff'
      }));

      if (onUpdateSpaces) {
        onUpdateSpaces(tailoredSpaces);
      }
    } catch {}
    onClose();
  };

  const handleOpenLinkedIn = () => {
    const url = 'https://www.linkedin.com/in/tylertan0/';
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const currentSpaces = ARCHETYPE_CONFIG[archetype].spaces;
  const displayName = userName.trim() ? userName.trim() : 'Explorer';

  return (
    <div className="lor-onboarding-canvas">
      {/* Organic ambient background depth */}
      <div className="lor-ambient-vignette" />
      <div className="lor-ambient-orb" />

      {/* Top Header Bar */}
      <header className="lor-onboard-header">
        <div className="lor-onboard-brand">
          <img src={LOR_LOGO} alt="Lor Logo" className="lor-onboard-logo" />
          <span className="lor-onboard-brand-name">Lor</span>
          <span className="lor-onboard-pill">v0.1.0</span>
        </div>

        {/* Stepper Dots (Arc Style) */}
        <div className="lor-onboard-stepper">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              key={idx}
              className={`lor-onboard-step-dot ${idx === slideIndex ? 'active' : ''} ${idx < slideIndex ? 'done' : ''}`}
              onClick={() => setSlideIndex(idx)}
              title={`Chapter ${idx + 1}`}
            />
          ))}
        </div>

        <button className="lor-onboard-skip-btn" onClick={handleFinish} title="Skip to browser (Esc)">
          <span>Skip</span>
          <X size={13} />
        </button>
      </header>

      {/* Center Hero Stage */}
      <main className="lor-onboard-stage">
        {/* =========================================================================
            SLIDE 0: IDENTITY & ARCHETYPE
           ========================================================================= */}
        {slideIndex === 0 && (
          <div className="lor-slide-content interactive-stage">
            <div className="lor-hero-logo-wrap">
              <div className="lor-hero-logo-halo" />
              <img src={LOR_LOGO} alt="Lor Logo" className="lor-hero-logo" />
            </div>

            <span className="lor-slide-tag">CHAPTER I • IDENTITY</span>
            <h1 className="lor-slide-headline">Welcome to Lor.</h1>
            <p className="lor-slide-subhead">A calm, bespoke browser engineered for continuous flow.</p>

            {/* User Name Input */}
            <div className="lor-user-input-wrap">
              <label className="lor-input-label">What should Lor call you?</label>
              <input
                type="text"
                className="lor-interactive-input"
                placeholder="Your name or call sign (e.g. Tyler)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Archetype Selector */}
            <div className="lor-archetype-section">
              <label className="lor-input-label">How do you primarily explore the web?</label>
              <div className="lor-archetype-grid">
                {(Object.keys(ARCHETYPE_CONFIG) as Archetype[]).map((key) => {
                  const item = ARCHETYPE_CONFIG[key];
                  const Icon = item.icon;
                  const isSelected = archetype === key;
                  return (
                    <div
                      key={key}
                      className={`lor-archetype-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setArchetype(key)}
                    >
                      <div className="archetype-icon-box">
                        <Icon size={18} />
                      </div>
                      <div className="archetype-content">
                        <div className="archetype-title">
                          <span>{item.label}</span>
                          {isSelected && <Check size={14} className="archetype-check" />}
                        </div>
                        <p className="archetype-desc">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SLIDE 1: DAILY RHYTHMS & TAB ANXIETY
           ========================================================================= */}
        {slideIndex === 1 && (
          <div className="lor-slide-content interactive-stage">
            <span className="lor-slide-tag">CHAPTER II • RHYTHMS & MEMORY</span>
            <h1 className="lor-slide-headline">The Amnesiac Slate, Cured.</h1>
            <p className="lor-slide-subhead">
              Modern browsers start from scratch every session, forcing you to reconstruct workflows and hoard 1,000 tabs out of fear.
            </p>

            <div className="lor-interactive-two-col">
              {/* Rhythm Selector */}
              <div className="lor-question-card">
                <label className="lor-input-label">When does your focus naturally peak?</label>
                <div className="lor-choice-list">
                  <div 
                    className={`lor-choice-item ${rhythm === 'morning' ? 'is-selected' : ''}`}
                    onClick={() => setRhythm('morning')}
                  >
                    <div className="choice-icon"><Sun size={16} /></div>
                    <div className="choice-info">
                      <strong>Morning Horizon (7:00 – 11:00 AM)</strong>
                      <span>Early momentum, reading feeds, daily planning.</span>
                    </div>
                  </div>

                  <div 
                    className={`lor-choice-item ${rhythm === 'focus' ? 'is-selected' : ''}`}
                    onClick={() => setRhythm('focus')}
                  >
                    <div className="choice-icon"><Zap size={16} /></div>
                    <div className="choice-info">
                      <strong>Deep Work Meridian (12:00 – 5:00 PM)</strong>
                      <span>Sustained programming, drafting, and research.</span>
                    </div>
                  </div>

                  <div 
                    className={`lor-choice-item ${rhythm === 'night' ? 'is-selected' : ''}`}
                    onClick={() => setRhythm('night')}
                  >
                    <div className="choice-icon"><Moon size={16} /></div>
                    <div className="choice-info">
                      <strong>Night Watch (9:00 PM – 2:00 AM)</strong>
                      <span>Quiet nocturnal deep dives and experimental labs.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Handling Style */}
              <div className="lor-question-card">
                <label className="lor-input-label">How do you handle open tabs?</label>
                <div className="lor-choice-list">
                  <div 
                    className={`lor-choice-item ${tabStyle === 'hoarder' ? 'is-selected' : ''}`}
                    onClick={() => setTabStyle('hoarder')}
                  >
                    <div className="choice-icon"><Snowflake size={16} /></div>
                    <div className="choice-info">
                      <strong>Tab Hoarder (Aggressive Freezing)</strong>
                      <span>
                        Tabs inactive for &gt; 25m are automatically hibernated to save 80% RAM and stored in your private Tab Vault.
                      </span>
                    </div>
                  </div>

                  <div 
                    className={`lor-choice-item ${tabStyle === 'minimalist' ? 'is-selected' : ''}`}
                    onClick={() => setTabStyle('minimalist')}
                  >
                    <div className="choice-icon"><Feather size={16} /></div>
                    <div className="choice-info">
                      <strong>Curated Minimalist</strong>
                      <span>Prefers keeping only 3–5 active tabs open per space with instant archive.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SLIDE 2: SPATIAL ARCHITECTURE & SIDEBAR AUTO-COLLAPSE
           ========================================================================= */}
        {slideIndex === 2 && (
          <div className="lor-slide-content split-stage">
            <div className="lor-text-column">
              <span className="lor-slide-tag">CHAPTER III • SPATIAL ARCHITECTURE</span>
              <h1 className="lor-slide-headline">Architecture for {displayName}.</h1>
              <p className="lor-slide-subhead">
                Based on your {ARCHETYPE_CONFIG[archetype].label} workflow, Lor has staged your dedicated spaces.
              </p>

              <div className="lor-callout-box">
                <div className="lor-callout-icon">
                  <PanelLeftClose size={16} />
                </div>
                <div className="lor-callout-text">
                  <strong>⌘B Auto-Collapse Sidebar:</strong>
                  <span>Press Cmd+B or hover the screen edge to collapse the sidebar off-screen for a 100% full-width immersive canvas.</span>
                </div>
              </div>

              <div className="lor-callout-box">
                <div className="lor-callout-icon">
                  <JupiterIcon size={16} />
                </div>
                <div className="lor-callout-text">
                  <strong>Two-Finger Glide:</strong>
                  <span>Swipe horizontally with two fingers in the sidebar or bottom dock to switch spaces instantly.</span>
                </div>
              </div>
            </div>

            <div className="lor-visual-column">
              <div className="lor-showcase-frame">
                <div className="lor-frame-bar">
                  <div className="lor-frame-lights">
                    <span className="light" />
                    <span className="light" />
                    <span className="light" />
                  </div>
                  <span className="lor-frame-title">lor://spaces/{currentSpaces[activePreviewSpaceIndex].toLowerCase()}</span>
                </div>

                <div className="lor-frame-body space-view">
                  {/* Space Selector Tabs */}
                  <div className="lor-space-preview-pills">
                    {currentSpaces.map((name, idx) => (
                      <button
                        key={name}
                        className={`space-pill-tab ${idx === activePreviewSpaceIndex ? 'active' : ''}`}
                        onClick={() => setActivePreviewSpaceIndex(idx)}
                      >
                        <JupiterIcon size={12} />
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mock Sidebar Tabs for Active Space */}
                  <div className="lor-mock-tabs-list">
                    {activePreviewSpaceIndex === 0 && (
                      <>
                        <div className="mock-tab-item active">
                          <span className="tab-dot" />
                          <span>Google Search & Daily Feeds</span>
                        </div>
                        <div className="mock-tab-item">
                          <span className="tab-dot" />
                          <span>Hacker News & Community Lore</span>
                        </div>
                      </>
                    )}
                    {activePreviewSpaceIndex === 1 && (
                      <>
                        <div className="mock-tab-item active">
                          <span className="tab-dot" />
                          <span>{currentSpaces[1]} • Production Repositories</span>
                        </div>
                        <div className="mock-tab-item">
                          <span className="tab-dot" />
                          <span>Linear & System Architectures</span>
                        </div>
                      </>
                    )}
                    {activePreviewSpaceIndex === 2 && (
                      <>
                        <div className="mock-tab-item active">
                          <span className="tab-dot" />
                          <span>{currentSpaces[2]} • ArXiv & Deep Reading</span>
                        </div>
                        <div className="mock-tab-item">
                          <span className="tab-dot" />
                          <span>Knowledge Obsidian Notes</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SLIDE 3: SOVEREIGN TAB VAULT & KEYSTROKE MASTERY
           ========================================================================= */}
        {slideIndex === 3 && (
          <div className="lor-slide-content split-stage">
            <div className="lor-text-column">
              <span className="lor-slide-tag">CHAPTER IV • ESSENTIAL KEYSTROKES</span>
              <h1 className="lor-slide-headline">Continuous Keystroke Flow.</h1>
              <p className="lor-slide-subhead">
                Master Lor without touching a trackpad. Designed for instant muscle memory.
              </p>

              {/* Master Shortcuts Table */}
              <div className="lor-shortcuts-showcase-grid">
                <div className="lor-shortcut-chip highlight">
                  <span className="shortcut-name">Tab Vault (Neural Memory)</span>
                  <div className="shortcut-keys"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>V</kbd></div>
                </div>

                <div className="lor-shortcut-chip">
                  <span className="shortcut-name">Auto-Collapse Sidebar</span>
                  <div className="shortcut-keys"><kbd>⌘</kbd><kbd>B</kbd></div>
                </div>

                <div className="lor-shortcut-chip">
                  <span className="shortcut-name">Split View Dual Viewport</span>
                  <div className="shortcut-keys"><kbd>⌘</kbd><kbd>S</kbd></div>
                </div>

                <div className="lor-shortcut-chip">
                  <span className="shortcut-name">Focus Omnibox / Search</span>
                  <div className="shortcut-keys"><kbd>⌘</kbd><kbd>L</kbd></div>
                </div>

                <div className="lor-shortcut-chip">
                  <span className="shortcut-name">History Archive (Lor + Chrome)</span>
                  <div className="shortcut-keys"><kbd>⌘</kbd><kbd>Y</kbd></div>
                </div>

                <div className="lor-shortcut-chip">
                  <span className="shortcut-name">New Tab / Command Bar</span>
                  <div className="shortcut-keys"><kbd>⌘</kbd><kbd>T</kbd></div>
                </div>
              </div>
            </div>

            <div className="lor-visual-column">
              <div className="lor-showcase-frame">
                <div className="lor-frame-bar">
                  <div className="lor-frame-lights">
                    <span className="light" />
                    <span className="light" />
                    <span className="light" />
                  </div>
                  <span className="lor-frame-title">lor://vault/neural-search</span>
                </div>

                <div className="lor-frame-body vault-sim-view">
                  <div className="vault-sim-header">
                    <div className="vault-sim-badge">
                      <Cpu size={12} />
                      <span>Apple Neural Engine • 0 MB Bloat</span>
                    </div>
                  </div>

                  {/* Interactive Search Simulator */}
                  <div className="vault-sim-search">
                    <Search size={14} className="search-icon" />
                    <input 
                      type="text"
                      className="vault-sim-input"
                      placeholder="Try searching: 'alignment paper' or 'recipe'..."
                      value={testVaultQuery}
                      onChange={(e) => setTestVaultQuery(e.target.value)}
                    />
                  </div>

                  <div className="vault-sim-results">
                    {testVaultQuery.toLowerCase().includes('align') || testVaultQuery.toLowerCase().includes('paper') ? (
                      <div className="vault-sim-card match">
                        <div className="sim-card-top">
                          <strong>Direct Preference Optimization (ArXiv:2305)</strong>
                          <span className="score-pill">98% Semantic Match</span>
                        </div>
                        <p className="sim-card-snippet">"Language model alignment without reinforcement learning..."</p>
                      </div>
                    ) : (
                      <>
                        <div className="vault-sim-card">
                          <div className="sim-card-top">
                            <strong>Direct Preference Optimization: Language Models</strong>
                            <span className="time-tag">Vaulted 3h ago</span>
                          </div>
                          <p className="sim-card-snippet">"We present DPO for training language models without RL..."</p>
                        </div>
                        <div className="vault-sim-card">
                          <div className="sim-card-top">
                            <strong>Obsidian Liquid Glass Design Tokens</strong>
                            <span className="time-tag">Vaulted yesterday</span>
                          </div>
                          <p className="sim-card-snippet">"Monochrome palette: pure black #000000 with frosted blur..."</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SLIDE 4: EPILOGUE • ARTISANAL CRAFT BY TYLER TAN
           ========================================================================= */}
        {slideIndex === 4 && (
          <div className="lor-slide-content epilogue-stage">
            <div className="lor-creator-card">
              <div className="lor-creator-badge-top">
                <Sparkles size={13} />
                <span>ARTISANAL SOFTWARE</span>
              </div>

              <div className="lor-creator-header-row">
                <img src={LOR_LOGO} alt="Lor Logo" className="lor-creator-logo" />
                <div className="lor-creator-meta">
                  <h2 className="lor-creator-title">Conceived & Crafted by Tyler Tan</h2>
                  <span className="lor-creator-subtitle">Software Architect & Product Designer</span>
                </div>
              </div>

              <p className="lor-creator-statement">
                "Lor was built with a belief that the software we look at for hours each day should possess calmness, taste, and soul. Every edge swipe, every pixel of liquid glass, and every database query was written to serve you—uncluttered, private, and fast."
              </p>

              <div className="lor-creator-actions">
                <button className="lor-linkedin-connect-btn" onClick={handleOpenLinkedIn}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  <span>Connect with Tyler Tan</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Controls (Arc Style) */}
      <footer className="lor-onboard-footer">
        <div className="lor-onboard-hint">
          <span className="keycap">←</span>
          <span className="keycap">→</span>
          <span>Use arrow keys or Enter to navigate</span>
        </div>

        <div className="lor-onboard-cta-group">
          {!isFirst && (
            <button className="lor-btn secondary" onClick={handlePrev}>
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}

          <button 
            className={`lor-btn primary ${isLast ? 'launch' : ''}`}
            onClick={handleNext}
          >
            <span>{isLast ? `Launch Lor as ${displayName}` : 'Continue'}</span>
            {isLast ? <Check size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </footer>
    </div>
  );
};
