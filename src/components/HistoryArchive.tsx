import React, { useState, useEffect } from 'react';
import { Search, X, Trash2, Clock, ExternalLink, Globe, RefreshCw, CheckCircle2 } from 'lucide-react';
import { HistoryItem, Space } from '../types/browser';

interface HistoryArchiveProps {
  isOpen: boolean;
  history: HistoryItem[];
  spaces: Space[];
  activeSpaceId: string;
  onClose: () => void;
  onOpenItem: (url: string) => void;
  onClearHistory: (spaceId?: string) => void;
  onRemoveItem: (id: string) => void;
}

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({
  isOpen,
  history,
  spaces,
  activeSpaceId,
  onClose,
  onOpenItem,
  onClearHistory,
  onRemoveItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceMode, setSourceMode] = useState<'chrome' | 'lor'>('chrome');
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState<string>(() => activeSpaceId);
  const [chromeHistory, setChromeHistory] = useState<HistoryItem[]>([]);
  const [isLoadingChrome, setIsLoadingChrome] = useState(false);

  const fetchChromeHistory = async () => {
    if ((window as any).electronAPI?.getChromeHistory) {
      setIsLoadingChrome(true);
      try {
        const items = await (window as any).electronAPI.getChromeHistory(350);
        if (items && Array.isArray(items)) {
          setChromeHistory(items);
        }
      } catch (err) {
        console.error('Failed to load Chrome history:', err);
      } finally {
        setIsLoadingChrome(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChromeHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter items based on active source mode
  const currentItems = sourceMode === 'chrome' ? chromeHistory : history;

  const filtered = currentItems.filter((item) => {
    if (sourceMode === 'lor' && selectedSpaceFilter !== 'all') {
      const matchSpaceId = item.spaceId && item.spaceId === selectedSpaceFilter;
      const targetSpace = spaces.find((s) => s.id === selectedSpaceFilter);
      const matchSpaceName = targetSpace && item.spaceName && item.spaceName.toLowerCase() === targetSpace.name.toLowerCase();
      if (!matchSpaceId && !matchSpaceName) return false;
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.url && item.url.toLowerCase().includes(q))
    );
  });

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleClearCurrent = () => {
    if (selectedSpaceFilter === 'all') {
      onClearHistory();
    } else {
      onClearHistory(selectedSpaceFilter);
    }
  };

  return (
    <div className="history-modal-backdrop" onClick={onClose}>
      <div className="history-modal-box history-revamped-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="history-header">
          <div className="history-title-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="history-source-segmented">
                <button
                  className={`history-source-tab ${sourceMode === 'chrome' ? 'active' : ''}`}
                  onClick={() => setSourceMode('chrome')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  </svg>
                  <span>Google Chrome</span>
                  {chromeHistory.length > 0 && (
                    <span className="history-count-pill">{chromeHistory.length}</span>
                  )}
                </button>

                <button
                  className={`history-source-tab ${sourceMode === 'lor' ? 'active' : ''}`}
                  onClick={() => setSourceMode('lor')}
                >
                  <Clock size={13} />
                  <span>Lor Spaces</span>
                  {history.length > 0 && (
                    <span className="history-count-pill">{history.length}</span>
                  )}
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {sourceMode === 'chrome' ? (
                <>
                  <button 
                    className={`history-action-btn ${isLoadingChrome ? 'spinning' : ''}`}
                    onClick={fetchChromeHistory}
                    title="Sync latest history from Google Chrome"
                  >
                    <RefreshCw size={13} className={isLoadingChrome ? 'spin' : ''} />
                    <span>Sync Chrome</span>
                  </button>

                  <button 
                    className="history-action-btn primary"
                    onClick={() => {
                      onOpenItem('https://myactivity.google.com/product/chrome');
                      onClose();
                    }}
                    title="Open live Google Account Web & App Activity"
                  >
                    <Globe size={13} />
                    <span>My Activity</span>
                  </button>
                </>
              ) : (
                <>
                  {filtered.length > 0 && (
                    <button 
                      className="history-action-btn" 
                      onClick={handleClearCurrent}
                      title="Clear Space History"
                    >
                      <Trash2 size={13} />
                      <span>Clear</span>
                    </button>
                  )}
                </>
              )}

              <button 
                className="history-close-btn" 
                onClick={onClose} 
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Space Filter Tabs (Only shown in Lor mode) */}
          {sourceMode === 'lor' ? (
            <div className="history-space-filter-bar">
              {spaces.map((sp) => (
                <button
                  key={sp.id}
                  className={`history-space-filter-btn ${selectedSpaceFilter === sp.id ? 'active' : ''}`}
                  onClick={() => setSelectedSpaceFilter(sp.id)}
                >
                  {sp.name}
                </button>
              ))}
              <button
                className={`history-space-filter-btn ${selectedSpaceFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedSpaceFilter('all')}
              >
                All Spaces
              </button>
            </div>
          ) : (
            <div className="chrome-history-banner">
              <CheckCircle2 size={13} color="#10b981" />
              <span>
                Connected to active Google Chrome profile. Searches & visits count towards your Google Account.
              </span>
            </div>
          )}

          {/* Search Bar */}
          <div className="history-search-container">
            <Search size={15} color="#8c8c94" />
            <input
              className="history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={sourceMode === 'chrome' ? "Search Google Chrome history..." : "Search spaces history..."}
              autoFocus
            />
            {searchQuery && (
              <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="history-list">
          {filtered.length === 0 ? (
            <div className="history-empty">
              <Clock size={28} color="rgba(255, 255, 255, 0.2)" />
              <p style={{ marginTop: 10, color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: 500 }}>
                {searchQuery 
                  ? 'No matching history found' 
                  : (sourceMode === 'chrome' ? 'No Google Chrome history found' : 'No history for this space')}
              </p>
              {sourceMode === 'chrome' && (
                <button 
                  className="history-action-btn primary" 
                  style={{ margin: '14px auto 0 auto' }}
                  onClick={() => {
                    onOpenItem('https://myactivity.google.com/product/chrome');
                    onClose();
                  }}
                >
                  Open Google Account My Activity
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => (
              <div 
                key={item.id} 
                className="history-item-row"
                onClick={() => {
                  onOpenItem(item.url);
                  onClose();
                }}
              >
                <div className="history-item-icon">
                  {item.favicon ? (
                    <img 
                      src={item.favicon} 
                      alt="" 
                      onError={(e) => (e.currentTarget.style.display = 'none')} 
                    />
                  ) : (
                    <span className="history-fallback-icon">
                      {item.title ? item.title.charAt(0).toUpperCase() : '•'}
                    </span>
                  )}
                </div>

                <div className="history-item-info">
                  <span className="history-item-title">{item.title || item.url}</span>
                  <span className="history-item-url">{item.url}</span>
                </div>

                <div className="history-item-meta" onClick={(e) => e.stopPropagation()}>
                  <span className={`history-space-tag ${item.source === 'chrome' ? 'chrome-tag' : ''}`}>
                    {item.spaceName || (sourceMode === 'chrome' ? 'Chrome' : 'Space')}
                  </span>
                  <span className="history-time-tag">{formatTime(item.timestamp)}</span>
                  {sourceMode === 'lor' && (
                    <button 
                      className="history-delete-item-btn" 
                      onClick={() => onRemoveItem(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button 
                    className="history-delete-item-btn" 
                    style={{ opacity: 0.8 }}
                    onClick={() => {
                      onOpenItem(item.url);
                      onClose();
                    }}
                    title="Open in new tab"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
