import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Link2, 
  Check, 
  Search, 
  Globe,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { Tab } from '../types/browser';

interface TopNavProps {
  activeTab?: Tab;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onNavigate: (url: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  isPinned = false,
  onTogglePin,
  onGoBack,
  onGoForward,
  onReload,
  onNavigate
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [faviconError, setFaviconError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with active tab URL when not actively editing
  useEffect(() => {
    if (!isEditing && activeTab?.url) {
      setInputVal(activeTab.url);
      setFaviconError(false);
    }
  }, [activeTab?.url, isEditing]);

  // Focus and select all text when editing is initiated
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Handle focus event triggered globally via Cmd+L / Cmd+T
  useEffect(() => {
    const handleFocusTrigger = () => {
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    };

    window.addEventListener('arco-focus-url', handleFocusTrigger);
    return () => window.removeEventListener('arco-focus-url', handleFocusTrigger);
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTab?.url) {
      navigator.clipboard.writeText(activeTab.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const isUrl = (str: string) => {
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(str.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    let targetUrl = query;
    if (isUrl(query)) {
      if (!/^https?:\/\//i.test(query)) {
        targetUrl = 'https://' + query;
      }
    } else {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    onNavigate(targetUrl);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setInputVal(activeTab?.url || '');
    }
  };

  const getDomain = (rawUrl?: string): string => {
    if (!rawUrl) return '';
    try {
      const u = new URL(rawUrl);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  const pageDomain = getDomain(activeTab?.url);

  return (
    <div className="sidebar-header">
      {/* Top Bar Navigation Buttons */}
      <div className="sidebar-top-drag">
        <div className="sidebar-nav-buttons" style={{ marginLeft: 'auto' }}>
          <button 
            className="icon-btn" 
            onClick={onGoBack} 
            disabled={!activeTab?.canGoBack}
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>

          <button 
            className="icon-btn" 
            onClick={onGoForward} 
            disabled={!activeTab?.canGoForward}
            title="Forward"
          >
            <ArrowRight size={16} />
          </button>

          <button 
            className="icon-btn" 
            onClick={onReload}
            title="Reload"
          >
            <RotateCw size={15} className={activeTab?.isLoading ? 'spin-anim' : ''} />
          </button>

          {onTogglePin && (
            <button 
              className={`icon-btn sidebar-pin-btn ${isPinned ? 'is-pinned' : 'is-unpinned'}`}
              onClick={onTogglePin}
              title={isPinned ? "Auto-collapse Sidebar (⌘B)" : "Pin Sidebar Open (⌘B)"}
            >
              {isPinned ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Address Pill: Page Preview (Title + Favicon) by default; Current URL input on click/edit */}
      <div 
        className={`url-pill-container ${isEditing ? 'focused' : ''}`}
        onClick={() => {
          if (!isEditing) {
            setInputVal(activeTab?.url || '');
            setIsEditing(true);
          }
        }}
      >
        {isEditing ? (
          /* Edit Mode: Shows current URL */
          <form className="url-pill-form" onSubmit={handleSubmit}>
            <Search size={15} color="#ffffff" style={{ flexShrink: 0 }} />
            
            <input
              ref={inputRef}
              className="url-pill-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              placeholder="Search or enter URL..."
              spellCheck={false}
            />

            <button 
              type="button"
              className="url-copy-btn" 
              onClick={handleCopy}
              title={copied ? "Copied" : "Copy URL"}
            >
              {copied ? <Check size={14} color="#ffffff" /> : <Link2 size={15} />}
            </button>
          </form>
        ) : (
          /* Preview Mode: Page Title + Favicon + Domain */
          <div className="url-pill-preview">
            <div className="url-pill-favicon">
              {activeTab?.favicon && !faviconError ? (
                <img 
                  src={activeTab.favicon} 
                  alt="" 
                  onError={() => setFaviconError(true)} 
                />
              ) : (
                <Globe size={14} color="#8c8c8c" />
              )}
            </div>

            <div className="url-pill-title-group">
              <span className="url-pill-page-title">
                {activeTab?.title || 'New Tab'}
              </span>
              {pageDomain && (
                <span className="url-pill-domain">
                  {pageDomain}
                </span>
              )}
            </div>

            <button 
              type="button"
              className="url-copy-btn" 
              onClick={handleCopy}
              title={copied ? "Copied" : "Copy URL"}
            >
              {copied ? <Check size={14} color="#ffffff" /> : <Link2 size={15} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
