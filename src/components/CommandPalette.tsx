import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { Tab } from '../types/browser';

interface CommandPaletteProps {
  isOpen: boolean;
  tabs: Tab[];
  onClose: () => void;
  onNavigate: (url: string, newTab: boolean) => void;
  onSelectTab: (tabId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  tabs,
  onClose,
  onNavigate,
  onSelectTab
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter tabs
  const matchingTabs = tabs.filter(
    (t) =>
      query.trim() !== '' &&
      (t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.url.toLowerCase().includes(query.toLowerCase()))
  );

  const isUrl = (str: string) => {
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(str.trim());
  };

  const formattedUrl = (str: string) => {
    let trimmed = str.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (!query.trim()) return;

      if (matchingTabs.length > 0 && selectedIndex < matchingTabs.length) {
        onSelectTab(matchingTabs[selectedIndex].id);
        onClose();
        return;
      }

      // Check if URL or Search
      if (isUrl(query)) {
        onNavigate(formattedUrl(query), true);
      } else {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
        onNavigate(searchUrl, true);
      }
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, matchingTabs.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-container">
          <Search size={18} color="#8a8d9b" />
          <input
            ref={inputRef}
            className="command-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL..."
          />
        </div>

        <div className="command-results">
          {query.trim() !== '' && (
            <div
              className={`command-result-item ${selectedIndex === 0 ? 'selected' : ''}`}
              onClick={() => {
                if (isUrl(query)) {
                  onNavigate(formattedUrl(query), true);
                } else {
                  onNavigate(`https://www.google.com/search?q=${encodeURIComponent(query)}`, true);
                }
                onClose();
              }}
            >
              {isUrl(query) ? <Globe size={18} /> : <Search size={18} />}
              <div>
                <div className="command-result-title">
                  {isUrl(query) ? `Open ${query}` : `Search Google for "${query}"`}
                </div>
                <div className="command-result-subtitle">Press Enter to open</div>
              </div>
            </div>
          )}

          {matchingTabs.map((tab, idx) => (
            <div
              key={tab.id}
              className={`command-result-item ${selectedIndex === idx + 1 ? 'selected' : ''}`}
              onClick={() => {
                onSelectTab(tab.id);
                onClose();
              }}
            >
              <Layers size={18} />
              <div>
                <div className="command-result-title">{tab.title}</div>
                <div className="command-result-subtitle">{tab.url}</div>
              </div>
            </div>
          ))}

          {query.trim() === '' && (
            <div style={{ padding: '16px 8px', color: '#6d7080', fontSize: 13, textAlign: 'center' }}>
              Type to search Google, enter a website URL, or jump to an open tab
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
