import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Globe, ArrowRight, CornerDownLeft, Clock, Layers, ExternalLink } from 'lucide-react';
import { HistoryItem, Tab } from '../types/browser';

interface CommandBarProps {
  isOpen: boolean;
  mode: 'new-tab' | 'edit-url';
  initialUrl?: string;
  history?: HistoryItem[];
  tabs?: Tab[];
  isPrivate?: boolean;
  onClose: () => void;
  onSubmit: (url: string, isNewTab: boolean) => void;
  onSelectTab?: (tabId: string) => void;
}

interface SuggestionItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  source: 'open-tab' | 'history' | 'google' | 'chrome';
  tabId?: string;
  spaceName?: string;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  mode,
  initialUrl = '',
  history = [],
  tabs = [],
  isPrivate = false,
  onClose,
  onSubmit,
  onSelectTab
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
  const [chromeHistory, setChromeHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit-url') {
        setQuery(initialUrl);
      } else {
        setQuery('');
      }
      setSelectedIndex(-1);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);

      // Load Chrome history once when CommandBar opens (strictly disabled in private windows)
      if (!isPrivate && (window as any).electronAPI?.getChromeHistory) {
        (window as any).electronAPI.getChromeHistory(150).then((items: any) => {
          if (items && Array.isArray(items)) {
            setChromeHistory(items);
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, mode, initialUrl, isPrivate]);

  const isUrl = (str: string) => {
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(str.trim());
  };

  // Live Google Omnibox search completion queries
  useEffect(() => {
    const q = query.trim();
    if (!q || isUrl(q)) {
      setGoogleSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        if ((window as any).electronAPI?.getGoogleSuggestions) {
          const res = await (window as any).electronAPI.getGoogleSuggestions(q);
          setGoogleSuggestions(res || []);
        }
      } catch {}
    }, 70);

    return () => clearTimeout(timer);
  }, [query]);

  // Aggregated search suggestions combining History (Lor + Chrome), Open Tabs, and Google Live Omnibox
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const q = query.trim().toLowerCase();
    const seenUrls = new Set<string>();
    const results: SuggestionItem[] = [];

    const normalizeUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        return (parsed.hostname + parsed.pathname).toLowerCase().replace(/\/$/, '');
      } catch {
        return u.toLowerCase().replace(/\/$/, '');
      }
    };

    const extractDomain = (u: string) => {
      try {
        return new URL(u).hostname.replace(/^www\./, '');
      } catch {
        return u.replace(/^https?:\/\//, '').split('/')[0];
      }
    };

    // 1. If query is blank: show recent unique historical sites from Chrome and Lor (disabled in private mode)
    if (!q) {
      if (isPrivate) return [];
      const allHistory = [...chromeHistory.slice(0, 8), ...history.slice(0, 8)];
      for (const h of allHistory) {
        if (!h.url || h.url.startsWith('about:') || h.url === 'about:blank') continue;
        const norm = normalizeUrl(h.url);
        if (seenUrls.has(norm)) continue;
        seenUrls.add(norm);

        results.push({
          id: `hist-${h.id}`,
          title: h.title || h.url,
          url: h.url,
          domain: extractDomain(h.url),
          favicon: h.favicon,
          source: (h as any).source === 'chrome' ? 'chrome' : 'history',
          spaceName: (h as any).source === 'chrome' ? 'Google Chrome' : h.spaceName
        });

        if (results.length >= 6) break;
      }
      return results;
    }

    // 2. Match currently open tabs
    if (tabs && tabs.length > 0) {
      for (const t of tabs) {
        if (!t.url || t.url.startsWith('about:')) continue;
        const titleMatch = t.title && t.title.toLowerCase().includes(q);
        const urlMatch = t.url.toLowerCase().includes(q);
        if (titleMatch || urlMatch) {
          const norm = normalizeUrl(t.url);
          seenUrls.add(norm);
          results.push({
            id: `tab-${t.id}`,
            title: t.title || t.url,
            url: t.url,
            domain: extractDomain(t.url),
            favicon: t.favicon,
            source: 'open-tab',
            tabId: t.id
          });
          if (results.length >= 2) break;
        }
      }
    }

    // 3. Match Google Chrome and Space History (strictly disabled in private windows)
    if (!isPrivate) {
      const combinedHistory = [...chromeHistory, ...history];
      const historyMatches: { item: SuggestionItem; score: number }[] = [];

      for (const h of combinedHistory) {
        if (!h.url || h.url.startsWith('about:')) continue;
        const norm = normalizeUrl(h.url);
        if (seenUrls.has(norm)) continue;

        const title = (h.title || '').toLowerCase();
        const urlLower = h.url.toLowerCase();
        const domain = extractDomain(h.url).toLowerCase();

        let score = 0;
        if (domain.startsWith(q)) {
          score = 100;
        } else if (title.startsWith(q)) {
          score = 80;
        } else if (domain.includes(q)) {
          score = 60;
        } else if (urlLower.includes(q)) {
          score = 50;
        } else if (title.includes(q)) {
          score = 40;
        }

        if (score > 0) {
          seenUrls.add(norm);
          historyMatches.push({
            score,
            item: {
              id: `hist-${h.id}`,
              title: h.title || h.url,
              url: h.url,
              domain: extractDomain(h.url),
              favicon: h.favicon,
              source: (h as any).source === 'chrome' ? 'chrome' : 'history',
              spaceName: (h as any).source === 'chrome' ? 'Google Chrome' : h.spaceName
            }
          });
        }
      }

      historyMatches.sort((a, b) => b.score - a.score);
      results.push(...historyMatches.slice(0, 4).map((m) => m.item));
    }

    // 4. Live Google Omnibox search completions
    if (googleSuggestions.length > 0) {
      for (const gs of googleSuggestions) {
        if (!gs || gs.toLowerCase() === q) continue;
        results.push({
          id: `goog-${gs}`,
          title: gs,
          url: `https://www.google.com/search?q=${encodeURIComponent(gs)}&sourceid=chrome&ie=UTF-8`,
          domain: 'Google Search',
          source: 'google'
        });
        if (results.length >= 8) break;
      }
    }

    return results;
  }, [query, history, chromeHistory, tabs, googleSuggestions]);

  // Keep selected item scrolled into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      if (item && item.scrollIntoView) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleSelectSuggestion = (item: SuggestionItem) => {
    if (item.source === 'open-tab' && item.tabId && onSelectTab && mode === 'new-tab') {
      onSelectTab(item.tabId);
      onClose();
      return;
    }
    onSubmit(item.url, mode === 'new-tab');
    onClose();
  };

  const handleExecute = () => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSelectSuggestion(suggestions[selectedIndex]);
      return;
    }

    const trimmed = query.trim();
    let targetUrl = trimmed;

    if (!trimmed) {
      targetUrl = 'https://www.google.com';
    } else if (isUrl(trimmed)) {
      if (!/^https?:\/\//i.test(trimmed)) {
        targetUrl = 'https://' + trimmed;
      }
    } else {
      // Execute through Google Search with active Google account attribution
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}&sourceid=chrome&ie=UTF-8`;
    }

    onSubmit(targetUrl, mode === 'new-tab');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev + 1 >= suggestions.length ? -1 : prev + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev <= -1 ? suggestions.length - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const displaySuggestionText = () => {
    if (!query.trim()) {
      return mode === 'new-tab' ? 'Press Enter to open Google' : 'Type to search or enter a URL';
    }
    if (isUrl(query.trim())) {
      return `Go to ${query.trim()}`;
    }
    return `Search Google for "${query.trim()}"`;
  };

  return (
    <div className="liquid-glass-backdrop" onClick={onClose}>
      <div className="liquid-glass-box" onClick={(e) => e.stopPropagation()}>
        {/* Input Row */}
        <div className="liquid-glass-input-row">
          {query.trim() && isUrl(query.trim()) ? (
            <Globe size={22} color="#ffffff" style={{ flexShrink: 0 }} />
          ) : (
            <Search size={22} color="#ffffff" style={{ flexShrink: 0 }} />
          )}

          <input
            ref={inputRef}
            className="liquid-glass-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'new-tab' ? "Search Google, Chrome history, or enter URL..." : "Enter URL or search..."}
            spellCheck={false}
          />

          <div className="liquid-glass-enter-pill" onClick={handleExecute}>
            <span>Enter</span>
            <CornerDownLeft size={12} />
          </div>
        </div>

        {/* Aggregated History & Visited Suggestions List */}
        {suggestions.length > 0 && (
          <>
            <div className="command-bar-section-title">
              {query.trim() ? 'Google Suggestions, Tabs & History' : 'Recently Visited'}
            </div>
            <div ref={listRef} className="command-bar-suggestions-list">
              {suggestions.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={item.id}
                    className={`command-bar-suggestion-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectSuggestion(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="command-bar-item-left">
                      <div className="command-bar-item-icon">
                        {item.source === 'google' ? (
                          <Search size={14} color="#60a5fa" />
                        ) : item.favicon ? (
                          <img
                            src={item.favicon}
                            alt=""
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : item.source === 'open-tab' ? (
                          <Layers size={14} color="#a1a1aa" />
                        ) : (
                          <Clock size={14} color="#8c8c94" />
                        )}
                      </div>

                      <div className="command-bar-item-content">
                        <span className="command-bar-item-title">{item.title}</span>
                        <span className="command-bar-item-url">{item.domain || item.url}</span>
                      </div>
                    </div>

                    <div className="command-bar-item-right">
                      {item.source === 'open-tab' ? (
                        <span className="command-bar-tag open-tab">Open Tab</span>
                      ) : item.source === 'google' ? (
                        <span className="command-bar-tag google-tag">Google Suggest</span>
                      ) : item.source === 'chrome' ? (
                        <span className="command-bar-tag chrome-tag">Chrome</span>
                      ) : (
                        <span className="command-bar-tag">{item.spaceName || 'History'}</span>
                      )}
                      {isSelected && <CornerDownLeft size={12} color="#ffffff" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Default Google search / direct URL action row */}
        <div
          className={`liquid-glass-suggestion ${selectedIndex === -1 && query.trim() ? 'selected' : ''}`}
          onClick={handleExecute}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowRight size={14} color="#8c8c8c" />
            <span>{displaySuggestionText()}</span>
          </div>
          <span style={{ fontSize: 11.5, color: '#666666' }}>
            {mode === 'new-tab' ? 'New Tab' : 'Current Tab'}
          </span>
        </div>
      </div>
    </div>
  );
};
