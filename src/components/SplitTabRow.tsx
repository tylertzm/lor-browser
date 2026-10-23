import React, { useState } from 'react';
import { X, Columns2 } from 'lucide-react';
import { Tab } from '../types/browser';

interface SplitTabRowProps {
  leftTab: Tab;
  rightTab: Tab;
  focusedTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onUnsplit: (tabId: string) => void;
}

export const SplitTabRow: React.FC<SplitTabRowProps> = ({
  leftTab,
  rightTab,
  focusedTabId,
  onSelectTab,
  onCloseTab,
  onUnsplit
}) => {
  const [leftImgError, setLeftImgError] = useState(false);
  const [rightImgError, setRightImgError] = useState(false);

  const getFallback = (tab: Tab) => {
    try {
      const u = new URL(tab.url);
      return u.hostname.charAt(0).toUpperCase();
    } catch {
      return tab.title.charAt(0).toUpperCase() || '•';
    }
  };

  const isGroupActive = focusedTabId === leftTab.id || focusedTabId === rightTab.id;

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    (window as any).__arco_dragged_tab_id = tabId;
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.setData('application/x-arco-tab', tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="split-tab-row-container">
      {/* Left Split Tab Pill */}
      <div 
        className={`split-tab-cell ${isGroupActive ? 'group-active' : ''} ${focusedTabId === leftTab.id ? 'focused active' : ''}`}
        onClick={() => onSelectTab(leftTab.id)}
        title={leftTab.title}
        draggable
        onDragStart={(e) => handleDragStart(e, leftTab.id)}
      >
        <div className="tab-icon">
          {leftTab.favicon && !leftImgError ? (
            <img 
              src={leftTab.favicon} 
              alt="" 
              onError={() => setLeftImgError(true)} 
            />
          ) : (
            <div className="tab-icon-fallback">
              {getFallback(leftTab)}
            </div>
          )}
        </div>

        <span className="tab-label">{leftTab.title || 'Untitled'}</span>

        <div className="split-cell-actions">
          <button 
            className="tab-action-btn unsplit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUnsplit(leftTab.id);
            }}
            title="Separate tab into individual tab"
          >
            <Columns2 size={11} />
          </button>
          <button 
            className="tab-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(leftTab.id);
            }}
            title="Close tab"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Quick Unsplit Divider between tabs */}
      <div 
        className="split-row-divider"
        onClick={(e) => {
          e.stopPropagation();
          onUnsplit(leftTab.id);
        }}
        title="Separate tabs"
      >
        <button 
          className="split-divider-unsplit-btn"
          title="Separate tabs"
        >
          <Columns2 size={10} />
        </button>
      </div>

      {/* Right Split Tab Pill */}
      <div 
        className={`split-tab-cell ${isGroupActive ? 'group-active' : ''} ${focusedTabId === rightTab.id ? 'focused active' : ''}`}
        onClick={() => onSelectTab(rightTab.id)}
        title={rightTab.title}
        draggable
        onDragStart={(e) => handleDragStart(e, rightTab.id)}
      >
        <div className="tab-icon">
          {rightTab.favicon && !rightImgError ? (
            <img 
              src={rightTab.favicon} 
              alt="" 
              onError={() => setRightImgError(true)} 
            />
          ) : (
            <div className="tab-icon-fallback">
              {getFallback(rightTab)}
            </div>
          )}
        </div>

        <span className="tab-label">{rightTab.title || 'Untitled'}</span>

        <div className="split-cell-actions">
          <button 
            className="tab-action-btn unsplit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUnsplit(rightTab.id);
            }}
            title="Separate tab into individual tab"
          >
            <Columns2 size={11} />
          </button>
          <button 
            className="tab-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(rightTab.id);
            }}
            title="Close tab"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
