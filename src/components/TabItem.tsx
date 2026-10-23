import React, { useState } from 'react';
import { X, Pin, PinOff, Columns2 } from 'lucide-react';
import { Tab } from '../types/browser';

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  onSplitScreen?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDropOnTab?: (draggedTabId: string, targetTabId: string) => void;
}

export const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  onSelect,
  onClose,
  onTogglePin,
  onSplitScreen,
  onDragStart,
  onDropOnTab
}) => {
  const [imgError, setImgError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragTarget, setIsDragTarget] = useState(false);

  const fallback = React.useMemo(() => {
    try {
      const url = new URL(tab.url);
      return url.hostname.charAt(0).toUpperCase();
    } catch {
      return tab.title.charAt(0).toUpperCase() || '•';
    }
  }, [tab.url, tab.title]);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', tab.id);
    e.dataTransfer.setData('application/x-arco-tab', tab.id);
    e.dataTransfer.effectAllowed = 'copyMove';
    (window as any).__arco_dragged_tab_id = tab.id;
    document.body.classList.add('is-dragging-tab');
    if (onDragStart) onDragStart(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    (window as any).__arco_dragged_tab_id = null;
    document.body.classList.remove('is-dragging-tab');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    const draggedId = (window as any).__arco_dragged_tab_id || e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== tab.id) {
      setIsDragTarget(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragTarget(false);
    document.body.classList.remove('is-dragging-tab');
    const draggedId = (window as any).__arco_dragged_tab_id || e.dataTransfer.getData('application/x-arco-tab') || e.dataTransfer.getData('text/plain');
    (window as any).__arco_dragged_tab_id = null;
    if (draggedId && draggedId !== tab.id && onDropOnTab) {
      onDropOnTab(draggedId, tab.id);
    }
  };

  return (
    <div 
      className={`tab-row ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragTarget ? 'split-drag-hover' : ''}`}
      onClick={onSelect}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title={tab.title}
    >
      <div className="tab-icon">
        {tab.favicon && !imgError ? (
          <img 
            src={tab.favicon} 
            alt="" 
            onError={() => setImgError(true)} 
          />
        ) : fallback ? (
          <div style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            backgroundColor: '#262626',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700
          }}>
            {fallback}
          </div>
        ) : null}
      </div>

      <span className="tab-label">{tab.title || 'Untitled'}</span>

      <div className="tab-actions">
        {onSplitScreen && (
          <button
            className="tab-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSplitScreen();
            }}
            title="Split"
          >
            <Columns2 size={13} />
          </button>
        )}

        {onTogglePin && (
          <button 
            className="tab-action-btn" 
            onClick={onTogglePin}
            title={tab.pinned ? "Unpin" : "Pin"}
          >
            {tab.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
        )}

        <button 
          className="tab-action-btn" 
          onClick={onClose}
          title="Close"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
