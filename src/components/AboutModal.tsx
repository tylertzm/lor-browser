import React from 'react';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  Columns2, 
  History, 
  ShieldCheck, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { LOR_LOGO } from '../assets/logoBase64';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayOnboarding?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onReplayOnboarding
}) => {
  if (!isOpen) return null;

  const handleOpenLinkedIn = () => {
    const url = 'https://www.linkedin.com/in/tylertan0/';
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="history-modal-backdrop" onClick={onClose}>
      <div 
        className="about-modal-box-v2" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="about-v2-glow" />

        {/* Top Header Row */}
        <div className="about-v2-header">
          <div className="about-v2-status-pill">
            <span className="about-v2-pulse-dot" />
            <span>Sovereign Desktop Runtime</span>
          </div>
          <button className="about-v2-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Hero Section */}
        <div className="about-v2-hero">
          <div className="about-v2-emblem-wrap">
            <div className="about-v2-emblem-halo" />
            <img src={LOR_LOGO} alt="Lor Logo" className="about-v2-emblem-img" />
          </div>

          <div className="about-v2-title-group">
            <div className="about-v2-title-row">
              <h1 className="about-v2-brand-name">Lor</h1>
              <span className="about-v2-version-chip">v0.1.0 • Artisanal</span>
            </div>
            <p className="about-v2-tagline">
              A calm, distraction-free sanctuary for explorers and thinkers.
            </p>
          </div>
        </div>

        {/* Creator Spotlight: Conceived & Crafted by Tyler Tan */}
        <div className="about-v2-creator-monolith">
          <div className="about-v2-creator-meta">
            <div className="about-v2-creator-badge">
              <Sparkles size={12} />
              <span>CONCEIVED & CRAFTED BY TYLER TAN</span>
            </div>
            <p className="about-v2-creator-quote">
              "Lor was built on the belief that software we look at for hours each day should possess calmness, taste, and soul. Every trackpad gesture, bicameral viewport split, and sovereign SQLite query was written to honor your attention."
            </p>
            <div className="about-v2-creator-footer">
              <span className="about-v2-author-label">— Tyler Tan, Software Architect & Product Designer</span>
              
              <button className="about-v2-linkedin-pill" onClick={handleOpenLinkedIn}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>Connect on LinkedIn</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Architectural Pillars Grid */}
        <div className="about-v2-pillars-grid">
          <div className="about-v2-pillar-card">
            <div className="pillar-icon-box">
              <Columns2 size={16} />
            </div>
            <div className="pillar-text-box">
              <h4>Bicameral Sight</h4>
              <p>Launch parallel dual viewports (Cmd+S) to cross-reference research and build side-by-side.</p>
            </div>
          </div>

          <div className="about-v2-pillar-card">
            <div className="pillar-icon-box">
              <History size={16} />
            </div>
            <div className="pillar-text-box">
              <h4>Sovereign Archive</h4>
              <p>Lock-free shadow copy of your Google Chrome SQLite database. Zero network telemetry.</p>
            </div>
          </div>

          <div className="about-v2-pillar-card">
            <div className="pillar-icon-box">
              <Layers size={16} />
            </div>
            <div className="pillar-text-box">
              <h4>Spatial Spaces</h4>
              <p>Contexts separated into living spaces with 1:1 hardware trackpad physics and liquid chrome.</p>
            </div>
          </div>

          <div className="about-v2-pillar-card">
            <div className="pillar-icon-box">
              <ShieldCheck size={16} />
            </div>
            <div className="pillar-text-box">
              <h4>Stealth Sandbox</h4>
              <p>Automated bot heuristics masked with genuine Chromium headers for Google Account login.</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Row */}
        <div className="about-v2-bottom-bar">
          {onReplayOnboarding && (
            <button className="about-v2-replay-action" onClick={onReplayOnboarding}>
              <Sparkles size={13} />
              <span>Replay Onboarding Lore</span>
            </button>
          )}

          <span className="about-v2-copyright">
            © {new Date().getFullYear()} Tyler Tan. Handcrafted with obsession.
          </span>
        </div>
      </div>
    </div>
  );
};
