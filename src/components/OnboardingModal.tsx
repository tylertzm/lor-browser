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
  Search
} from 'lucide-react';
import { LOR_LOGO } from '../assets/logoBase64';
import { JupiterIcon } from './SpaceSwitcher';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
}

interface SlideData {
  id: number;
  tag: string;
  headline: string;
  subhead: string;
  story: string;
}

const SLIDES: SlideData[] = [
  {
    id: 0,
    tag: 'PROLOGUE',
    headline: 'The Internet, Reclaimed.',
    subhead: 'A calm sanctuary for explorers, thinkers, and seekers of lore.',
    story:
      'We spend our lives inside browsers, yet most browsers feel like noisy office cubicles. Lor was conceived to return to the wonder of the early web: a private study overlooking the cosmos—monochrome, distraction-free, and crafted with obsessive care.'
  },
  {
    id: 1,
    tag: 'SPATIAL ARCHITECTURE',
    headline: 'Architecture for the Mind.',
    subhead: 'Move between Work, Research, and Labs with a glide.',
    story:
      'Tabs should not be an endless graveyard of horizontal clutter. In Lor, your contexts live in dedicated Spaces. Switch effortlessly with trackpad gestures or orbital dock dots, while the liquid sidebar dissolves when you want pure focus.'
  },
  {
    id: 2,
    tag: 'BICAMERAL SIGHT',
    headline: 'Two Worlds, Side by Side.',
    subhead: 'Compare, cross-reference, and create without alt-tab fatigue.',
    story:
      'True deep work happens in parallel. Drag any tab or press Cmd+S to launch dual viewport split view. Read research while writing, or inspect code alongside live interfaces in high-resolution liquid glass.'
  },
  {
    id: 3,
    tag: 'SOVEREIGN ARCHIVE',
    headline: 'Your History, Locally Sovereign.',
    subhead: 'Instant Google Chrome sync with zero telemetry.',
    story:
      'Never lose a trail. Lor connects directly to your local Google Chrome history snapshot, paired with live Omnibox search completions. Everything stays strictly on your Mac—untouchable and completely private.'
  },
  {
    id: 4,
    tag: 'ARTISANAL CRAFT',
    headline: 'Welcome to Lor.',
    subhead: 'Conceived, designed, and engineered by Tyler Tan.',
    story:
      'Lor is an independent labor of love—built for people who care about taste, typography, fluid trackpad physics, and how software feels under their fingers. Step inside your new universe of browsing.'
  }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onOpenAbout
}) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [activePreviewSpace, setActivePreviewSpace] = useState<'Personal' | 'Work' | 'Labs'>('Personal');

  useEffect(() => {
    if (isOpen) {
      setSlideIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [isOpen, slideIndex]);

  if (!isOpen) return null;

  const safeIndex = Math.max(0, Math.min(SLIDES.length - 1, slideIndex));
  const currentSlide = SLIDES[safeIndex] || SLIDES[0];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setSlideIndex((prev) => Math.min(SLIDES.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('lor_onboarding_v2_completed', 'true');
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

  return (
    <div className="lor-onboarding-canvas">
      {/* Subtle organic ambient background depth */}
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
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              className={`lor-onboard-step-dot ${idx === slideIndex ? 'active' : ''} ${idx < slideIndex ? 'done' : ''}`}
              onClick={() => setSlideIndex(idx)}
              title={s.tag}
            />
          ))}
        </div>

        <button className="lor-onboard-skip-btn" onClick={handleFinish} title="Skip to browser (Esc)">
          <span>Skip</span>
          <X size={13} />
        </button>
      </header>

      {/* Center Hero Stage (Arc-inspired bespoke presentation) */}
      <main className="lor-onboard-stage">
        {/* Slide 0: Prologue — Meet Lor */}
        {safeIndex === 0 && (
          <div className="lor-slide-content prologue-stage">
            <div className="lor-hero-logo-wrap">
              <div className="lor-hero-logo-halo" />
              <img src={LOR_LOGO} alt="Lor Logo" className="lor-hero-logo" />
            </div>

            <span className="lor-slide-tag">{currentSlide.tag}</span>
            <h1 className="lor-slide-headline">{currentSlide.headline}</h1>
            <p className="lor-slide-subhead">{currentSlide.subhead}</p>
            <p className="lor-slide-story">{currentSlide.story}</p>

            <div className="lor-prologue-pills">
              <span className="lor-feature-chip">
                <JupiterIcon size={13} />
                <span>Spatial Tabs</span>
              </span>
              <span className="lor-feature-chip">
                <Columns2 size={13} />
                <span>Bicameral Split View</span>
              </span>
              <span className="lor-feature-chip">
                <History size={13} />
                <span>Google Chrome SQLite Sync</span>
              </span>
              <span className="lor-feature-chip">
                <Compass size={13} />
                <span>Fluid 1:1 Page Swipe</span>
              </span>
            </div>
          </div>
        )}

        {/* Slide 1: Spaces Architecture */}
        {safeIndex === 1 && (
          <div className="lor-slide-content split-stage">
            <div className="lor-text-column">
              <span className="lor-slide-tag">{currentSlide.tag}</span>
              <h1 className="lor-slide-headline">{currentSlide.headline}</h1>
              <p className="lor-slide-subhead">{currentSlide.subhead}</p>
              <p className="lor-slide-story">{currentSlide.story}</p>
              
              <div className="lor-interactive-hint">
                <span className="lor-hint-label">Try switching spaces:</span>
                <div className="lor-space-switcher-preview">
                  {(['Personal', 'Work', 'Labs'] as const).map((space) => (
                    <button
                      key={space}
                      className={`lor-preview-space-btn ${activePreviewSpace === space ? 'active' : ''}`}
                      onClick={() => setActivePreviewSpace(space)}
                    >
                      <span className="lor-preview-dot" />
                      <span>{space}</span>
                    </button>
                  ))}
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
                  <span className="lor-frame-title">lor://spaces/{activePreviewSpace.toLowerCase()}</span>
                </div>
                <div className="lor-frame-body space-view">
                  <div className="lor-mock-sidebar">
                    <div className="mock-space-badge">
                      <JupiterIcon size={13} />
                      <span>{activePreviewSpace} Space</span>
                    </div>

                    <div className="mock-tab-group">
                      <span className="mock-label">PINNED</span>
                      <div className="mock-tab-row active">
                        <span className="mock-fav">🔍</span>
                        <span>Google Search</span>
                      </div>
                      <div className="mock-tab-row">
                        <span className="mock-fav">🐙</span>
                        <span>GitHub Dashboard</span>
                      </div>
                    </div>

                    <div className="mock-tab-group">
                      <span className="mock-label">TODAY</span>
                      <div className="mock-tab-row">
                        <span className="mock-fav">📜</span>
                        <span>Library of Alexandria Lore</span>
                      </div>
                      <div className="mock-tab-row">
                        <span className="mock-fav">🪐</span>
                        <span>Orbital Mechanics</span>
                      </div>
                    </div>
                  </div>

                  <div className="lor-mock-content">
                    <div className="mock-canvas-card">
                      <div className="mock-canvas-header">
                        <span className="mock-canvas-tag">Focused Viewport</span>
                        <h3>{activePreviewSpace} Environment</h3>
                      </div>
                      <p>Full 100% canvas viewport. The liquid sidebar auto-collapses to let you immerse in pure content.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 2: Dual Split View */}
        {safeIndex === 2 && (
          <div className="lor-slide-content split-stage">
            <div className="lor-text-column">
              <span className="lor-slide-tag">{currentSlide.tag}</span>
              <h1 className="lor-slide-headline">{currentSlide.headline}</h1>
              <p className="lor-slide-subhead">{currentSlide.subhead}</p>
              <p className="lor-slide-story">{currentSlide.story}</p>

              <div className="lor-callout-box">
                <div className="lor-callout-icon">
                  <Columns2 size={16} />
                </div>
                <div className="lor-callout-text">
                  <strong>Cmd + S Shortcut:</strong>
                  <span>Instantly split the active tab with any other open tab or start a fresh query side-by-side.</span>
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
                  <span className="lor-frame-title">dual: docs.lor.dev ↔ linear.app</span>
                </div>

                <div className="lor-frame-body split-view">
                  <div className="lor-split-half left">
                    <div className="lor-split-topbar">
                      <span>Pane 1 • Research Reference</span>
                    </div>
                    <div className="lor-code-preview">
                      <p className="code-comment">// Fluid trackpad navigation</p>
                      <p><span className="keyword">const</span> session = <span className="value">new LorSpace()</span>;</p>
                      <p>session.<span className="fn">split</span>({'{'} sync: <span className="value">true</span> {'}'});</p>
                    </div>
                  </div>

                  <div className="lor-split-divider-line">
                    <div className="lor-split-grip" />
                  </div>

                  <div className="lor-split-half right">
                    <div className="lor-split-topbar">
                      <span>Pane 2 • Live Workspace</span>
                    </div>
                    <div className="lor-task-preview">
                      <div className="task-row done">
                        <Check size={12} />
                        <span>Lock-free Chrome History Sync</span>
                      </div>
                      <div className="task-row done">
                        <Check size={12} />
                        <span>Bespoke Monochrome Onboarding</span>
                      </div>
                      <div className="task-row active">
                        <span className="task-dot" />
                        <span>1:1 Page Swipe Physics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 3: Google Chrome History Sync */}
        {safeIndex === 3 && (
          <div className="lor-slide-content split-stage">
            <div className="lor-text-column">
              <span className="lor-slide-tag">{currentSlide.tag}</span>
              <h1 className="lor-slide-headline">{currentSlide.headline}</h1>
              <p className="lor-slide-subhead">{currentSlide.subhead}</p>
              <p className="lor-slide-story">{currentSlide.story}</p>

              <div className="lor-callout-box">
                <div className="lor-callout-icon">
                  <History size={16} />
                </div>
                <div className="lor-callout-text">
                  <strong>Cmd + Y Archive:</strong>
                  <span>Toggle between your Google Chrome database and Lor Spaces with a single click.</span>
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
                  <span className="lor-frame-title">lor://history/chrome</span>
                </div>

                <div className="lor-frame-body history-view">
                  <div className="lor-omnibox-mock">
                    <Search size={14} className="search-icon" />
                    <span className="omnibox-text">quantum computing research</span>
                    <span className="omnibox-cursor">|</span>
                  </div>

                  <div className="lor-history-items-mock">
                    <div className="mock-history-row active">
                      <Search size={12} />
                      <span className="mock-hist-title">quantum computing architecture</span>
                      <span className="mock-hist-badge">Google Suggest</span>
                    </div>
                    <div className="mock-history-row">
                      <History size={12} />
                      <span className="mock-hist-title">MIT Technology Review — Quantum Supremacy</span>
                      <span className="mock-hist-badge chrome">Chrome History</span>
                    </div>
                    <div className="mock-history-row">
                      <History size={12} />
                      <span className="mock-hist-title">ArXiv: Superconducting Qubits & Telemetry</span>
                      <span className="mock-hist-badge chrome">Chrome History</span>
                    </div>
                  </div>

                  <div className="mock-segment-pill">
                    <span className="segment-active">Google Chrome</span>
                    <span>Lor Spaces</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 4: Epilogue — Crafted by Tyler Tan */}
        {safeIndex === 4 && (
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
            <span>{isLast ? 'Launch Lor' : 'Continue'}</span>
            {isLast ? <Check size={14} /> : <ArrowRight size={14} />}
          </button>
        </div>
      </footer>
    </div>
  );
};
