import React, { useState, useEffect } from 'react';
import { Search, X, Plus, Columns2, Globe } from 'lucide-react';
import { Tab } from '../types/browser';

interface SplitTabPickerProps {
  isOpen: boolean;
  tabs: Tab[];
  activeTabId: string;
  activeSpaceId: string;
  onClose: () => void;
  onSelectTabToSplit: (tabId: string) => void;
  onNewTabSplit: () => void;
}

export const SplitTabPicker: React.FC<SplitTabPickerProps> = ({
  isOpen,
  tabs,
  activeTabId,
  activeSpaceId,
  onClose,
  onSelectTabToSplit,
  onNewTabSplit
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter tabs in the current space except the active tab
  const availableTabs = tabs
    .filter((t) => t.spaceId === activeSpaceId && t.id !== activeTabId)
    .filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.url && t.url.toLowerCase().includes(q))
      );
    });

  return (
    <div className="liquid-glass-backdrop" onClick={onClose}>
      <div 
        className="split-picker-box" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="split-picker-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Columns2 size={16} color="#ffffff" />
            <span className="split-picker-title">Split Screen With</span>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="split-picker-search">
          <Search size={14} color="#8c8c8c" />
          <input
            className="split-picker-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search open tabs..."
            autoFocus
          />
        </div>

        {/* List of tabs + New Tab option */}
        <div className="split-picker-list">
          {/* Option: New Tab in Split */}
          <div 
            className="split-picker-item new-tab-split-item"
            onClick={() => {
              onNewTabSplit();
              onClose();
            }}
          >
            <div className="split-picker-item-icon">
              <Plus size={14} color="#ffffff" />
            </div>
            <div className="split-picker-item-text">
              <span className="split-picker-item-title">New Tab</span>
              <span className="split-picker-item-url">https://www.google.com</span>
            </div>
          </div>

          {availableTabs.length > 0 && (
            <div className="split-picker-section-label">Open Tabs in this Space</div>
          )}

          {availableTabs.map((tab) => (
            <div 
              key={tab.id}
              className="split-picker-item"
              onClick={() => {
                onSelectTabToSplit(tab.id);
                onClose();
              }}
            >
              <div className="split-picker-item-icon">
                {tab.favicon ? (
                  <img src={tab.favicon} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <Globe size={13} color="#8c8c8c" />
                )}
              </div>
              <div className="split-picker-item-text">
                <span className="split-picker-item-title">{tab.title || 'Untitled'}</span>
                <span className="split-picker-item-url">{tab.url}</span>
              </div>
            </div>
          ))}

          {availableTabs.length === 0 && !searchQuery && (
            <div className="split-picker-empty">
              No other tabs open in this space. Click "New Tab" above to browse side-by-side!
            </div>
          )}

          {availableTabs.length === 0 && searchQuery && (
            <div className="split-picker-empty">
              No tabs match "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
