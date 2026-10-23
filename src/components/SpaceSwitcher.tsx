import React, { useState, useRef, useEffect } from 'react';
import { Archive, Download, Plus, Trash2, Edit2, Check, X, Info, Settings } from 'lucide-react';
import { Space, DownloadItem } from '../types/browser';

// Modern 2026 Jupiter Planetary Icon (Celestial core with tilted ring system)
export const JupiterIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.75" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="5" />
    <ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-28 12 12)" />
  </svg>
);

interface SpaceSwitcherProps {
  spaces: Space[];
  activeSpaceId: string;
  isPrivate?: boolean;
  onSelectSpace: (spaceId: string) => void;
  onAddSpace: (name?: string) => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onOpenArchive: () => void;
  onOpenDownloads?: () => void;
  onOpenAbout?: () => void;
  onOpenSettings?: (tab?: 'appearance' | 'history' | 'shortcuts' | 'about') => void;
  activeDownloadsCount?: number;
  downloads?: DownloadItem[];
  onDropTabOnSpace: (tabId: string, spaceId: string) => void;
}

export const SpaceSwitcher: React.FC<SpaceSwitcherProps> = ({
  spaces,
  activeSpaceId,
  isPrivate = false,
  onSelectSpace,
  onAddSpace,
  onRenameSpace,
  onDeleteSpace,
  onOpenArchive,
  onOpenDownloads,
  onOpenAbout,
  onOpenSettings,
  activeDownloadsCount = 0,
  downloads = [],
  onDropTabOnSpace
}) => {
  const [dragOverSpaceId, setDragOverSpaceId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  // Active download notification state
  const [activeNotification, setActiveNotification] = useState<DownloadItem | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const prevCompletedIdsRef = useRef<Set<string>>(new Set());
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize known completed IDs on mount so we don't notify for old history
  useEffect(() => {
    if (downloads && downloads.length > 0) {
      downloads.forEach((d) => {
        if (d.state === 'completed') {
          prevCompletedIdsRef.current.add(d.id);
        }
      });
    }
  }, []);

  // Monitor download updates for active progression or new completion
  useEffect(() => {
    if (!downloads || downloads.length === 0) return;

    // Check for actively progressing download
    const progressing = downloads.find((d) => d.state === 'progressing');
    if (progressing) {
      if (dismissedId !== progressing.id) {
        setActiveNotification(progressing);
      }
      return;
    }

    // Check for newly completed items (items that finished while the app is running)
    const newlyCompleted = downloads.find(
      (d) => d.state === 'completed' && !prevCompletedIdsRef.current.has(d.id)
    );

    // Update known completed set
    downloads.forEach((d) => {
      if (d.state === 'completed') {
        prevCompletedIdsRef.current.add(d.id);
      }
    });

    if (newlyCompleted && dismissedId !== newlyCompleted.id) {
      setActiveNotification(newlyCompleted);

      if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
    }
  }, [downloads, dismissedId]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setEditingSpaceId(null);
        setIsCreatingNew(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  useEffect(() => {
    if (editingSpaceId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingSpaceId]);

  useEffect(() => {
    if (isCreatingNew) {
      newInputRef.current?.focus();
    }
  }, [isCreatingNew]);

  const handleDragOver = (e: React.DragEvent, spaceId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSpaceId(spaceId);
  };

  const handleDragLeave = () => {
    setDragOverSpaceId(null);
  };

  const handleDrop = (e: React.DragEvent, spaceId: string) => {
    e.preventDefault();
    setDragOverSpaceId(null);
    const tabId = (window as any).__arco_dragged_tab_id || e.dataTransfer.getData('application/x-arco-tab') || e.dataTransfer.getData('text/plain');
    if (tabId) {
      onDropTabOnSpace(tabId, spaceId);
    }
  };

  const startRename = (space: Space) => {
    setEditingSpaceId(space.id);
    setEditNameVal(space.name);
  };

  const saveRename = (spaceId: string) => {
    if (editNameVal.trim()) {
      onRenameSpace(spaceId, editNameVal.trim());
    }
    setEditingSpaceId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      onAddSpace(newSpaceName.trim());
      setNewSpaceName('');
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="sidebar-dock" ref={menuRef}>
      {/* Left: Open History Archive & Downloads */}
      <div className="dock-left-actions">
        {!isPrivate && (
          <button 
            className="icon-btn" 
            onClick={onOpenArchive} 
            title="History (Cmd+Y)"
          >
            <Archive size={15} />
          </button>
        )}
        {onOpenDownloads && (
          <div className="downloads-dock-wrapper">
            <button 
              className={`icon-btn downloads-dock-btn ${activeNotification ? 'has-active-notif' : ''}`} 
              onClick={() => {
                setActiveNotification(null);
                onOpenDownloads();
              }} 
              title="Downloads (Cmd+J)"
            >
              <Download size={15} />
              {activeDownloadsCount > 0 && <span className="download-pulse-dot" />}
            </button>

            {/* Notification popup anchored to the button */}
            {activeNotification && (
              <div 
                className="download-notif-popup"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNotification(null);
                  onOpenDownloads();
                }}
              >
                <div className="download-notif-header">
                  <div className="download-notif-status">
                    {activeNotification.state === 'progressing' ? (
                      <>
                        <span className="download-notif-spinner" />
                        <span className="download-notif-title">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} color="#10b981" />
                        <span className="download-notif-title" style={{ color: '#10b981' }}>Complete</span>
                      </>
                    )}
                  </div>
                  <button
                    className="download-notif-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDismissedId(activeNotification.id);
                      setActiveNotification(null);
                    }}
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="download-notif-filename" title={activeNotification.filename}>
                  {activeNotification.filename}
                </div>

                {activeNotification.state === 'progressing' ? (
                  <div className="download-notif-progress-wrap">
                    <div className="download-notif-bar">
                      <div 
                        className="download-notif-fill" 
                        style={{ 
                          width: `${activeNotification.totalBytes > 0 
                            ? Math.min(100, Math.round((activeNotification.receivedBytes / activeNotification.totalBytes) * 100))
                            : 0}%` 
                        }} 
                      />
                    </div>
                    <span className="download-notif-meta">
                      {formatBytes(activeNotification.receivedBytes)} / {formatBytes(activeNotification.totalBytes)}
                    </span>
                  </div>
                ) : (
                  <div className="download-notif-meta">
                    {formatBytes(activeNotification.totalBytes || activeNotification.receivedBytes)} • Click to open
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {onOpenSettings && (
          <button
            className="icon-btn"
            onClick={() => onOpenSettings('appearance')}
            title="Settings & Preferences (Cmd+,)"
          >
            <Settings size={15} />
          </button>
        )}
      </div>

      {/* Center: Interactive Dots (Droppable to move tabs between spaces) */}
      <div className="dock-dots">
        {spaces.map((space) => {
          const isActive = space.id === activeSpaceId;
          const isDragOver = space.id === dragOverSpaceId;

          return (
            <div
              key={space.id}
              className={`dock-dot ${isActive ? 'active' : ''}`}
              style={{
                transform: isDragOver ? 'scale(1.4)' : undefined,
                boxShadow: isDragOver ? '0 0 8px rgba(255, 255, 255, 0.6)' : undefined
              }}
              onClick={() => onSelectSpace(space.id)}
              onDragOver={(e) => handleDragOver(e, space.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, space.id)}
              title={space.name}
            />
          );
        })}
      </div>

      {/* Right: Jupiter Icon to CRUD Spaces */}
      <button 
        className={`icon-btn jupiter-btn ${menuOpen ? 'active' : ''}`} 
        onClick={() => setMenuOpen((prev) => !prev)} 
        title="Spaces Manager (Jupiter)"
      >
        <JupiterIcon size={16} />
      </button>

      {/* Liquid Glass Space CRUD Manager Popup */}
      {menuOpen && (
        <div className="space-crud-popover">
          <div className="space-crud-header">
            <span className="space-crud-title">Spaces</span>
            <button 
              className="space-crud-add-btn" 
              onClick={() => {
                setIsCreatingNew(true);
                setNewSpaceName(`Space ${spaces.length + 1}`);
              }}
              title="Create new space"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          {/* Create New Space Inline Form */}
          {isCreatingNew && (
            <form className="space-crud-create-form" onSubmit={handleCreateSubmit}>
              <input 
                ref={newInputRef}
                className="space-crud-input"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Space name..."
              />
              <button type="submit" className="space-crud-action-icon" title="Confirm">
                <Check size={12} />
              </button>
              <button 
                type="button" 
                className="space-crud-action-icon" 
                onClick={() => setIsCreatingNew(false)}
                title="Cancel"
              >
                <X size={12} />
              </button>
            </form>
          )}

          {/* List of Spaces with Edit & Delete */}
          <div className="space-crud-list">
            {spaces.map((space) => {
              const isEditing = editingSpaceId === space.id;
              const isActive = space.id === activeSpaceId;

              return (
                <div 
                  key={space.id} 
                  className={`space-crud-row ${isActive ? 'active-space' : ''}`}
                >
                  <div 
                    className={`space-indicator-dot ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectSpace(space.id);
                      setMenuOpen(false);
                    }}
                  />

                  {isEditing ? (
                    <input 
                      ref={editInputRef}
                      className="space-crud-input inline"
                      value={editNameVal}
                      onChange={(e) => setEditNameVal(e.target.value)}
                      onBlur={() => saveRename(space.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(space.id);
                        if (e.key === 'Escape') setEditingSpaceId(null);
                      }}
                    />
                  ) : (
                    <span 
                      className="space-crud-name"
                      onClick={() => {
                        onSelectSpace(space.id);
                        setMenuOpen(false);
                      }}
                      title={space.name}
                    >
                      {space.name}
                    </span>
                  )}

                  <div className="space-crud-row-actions">
                    {isEditing ? (
                      <button 
                        className="space-crud-action-icon" 
                        onClick={() => saveRename(space.id)}
                        title="Save"
                      >
                        <Check size={12} />
                      </button>
                    ) : (
                      <button 
                        className="space-crud-action-icon" 
                        onClick={() => startRename(space)}
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}

                    {spaces.length > 1 && (
                      <button 
                        className="space-crud-action-icon delete" 
                        onClick={() => onDeleteSpace(space.id)}
                        title="Delete space"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
