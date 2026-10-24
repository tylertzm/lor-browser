import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Tab, Space, DownloadItem } from '../types/browser';
import { TopNav } from './TopNav';
import { TabItem } from './TabItem';
import { SplitTabRow } from './SplitTabRow';
import { SpaceSwitcher } from './SpaceSwitcher';

interface SidebarProps {
  isOpen: boolean;
  isPinnedOpen: boolean;
  onTogglePin?: () => void;
  sidebarWidth: number;
  isResizing: boolean;
  onStartResize: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activeTab?: Tab;
  tabs: Tab[];
  activeSpaceId: string;
  spaces: Space[];
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onTogglePinTab: (tabId: string) => void;
  onMoveTabToPinned: (tabId: string) => void;
  onMoveTabToToday: (tabId: string) => void;
  onDropTabOnSpace: (tabId: string, spaceId: string) => void;
  onNewTab: () => void;
  onClearTabs: () => void;
  onSelectSpace: (spaceId: string) => void;
  onAddSpace: () => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onNavigate: (url: string) => void;
  onSwipeSpace: (direction: 'left' | 'right') => void;
  onOpenArchive: () => void;
  onOpenVault?: () => void;
  onOpenDownloads: () => void;
  onOpenAbout?: () => void;
  onOpenSettings?: (tab?: 'appearance' | 'history' | 'shortcuts' | 'about') => void;
  downloads?: DownloadItem[];
  downloadsCount?: number;
  activeDownloadsCount?: number;
  isPrivate?: boolean;
  onOpenSplitPicker: () => void;
  onSplitTabWith: (firstTabId: string, secondTabId?: string) => void;
  onUnsplitTab?: (tabId: string) => void;
  splitLeftTabId?: string | null;
  splitRightTabId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isPinnedOpen,
  onTogglePin,
  sidebarWidth,
  isResizing,
  onStartResize,
  onMouseEnter,
  onMouseLeave,
  activeTab,
  tabs,
  activeSpaceId,
  spaces,
  onGoBack,
  onGoForward,
  onReload,
  onSelectTab,
  onCloseTab,
  onTogglePinTab,
  onMoveTabToPinned,
  onMoveTabToToday,
  onDropTabOnSpace,
  onNewTab,
  onClearTabs,
  onSelectSpace,
  onAddSpace,
  onRenameSpace,
  onDeleteSpace,
  onNavigate,
  onSwipeSpace,
  onOpenArchive,
  onOpenVault,
  onOpenDownloads,
  onOpenAbout,
  onOpenSettings,
  isPrivate = false,
  downloads = [],
  downloadsCount = 0,
  activeDownloadsCount = 0,
  onOpenSplitPicker,
  onSplitTabWith,
  onUnsplitTab,
  splitLeftTabId,
  splitRightTabId
}) => {
  const currentSpaceTabs = tabs.filter((t) => t.spaceId === activeSpaceId);
  const pinnedTabs = currentSpaceTabs.filter((t) => t.pinned);
  const unpinnedTabs = currentSpaceTabs.filter((t) => !t.pinned);
  const currentSpace = spaces.find((s) => s.id === activeSpaceId);

  const [dragOverPinned, setDragOverPinned] = useState(false);
  const [dragOverTabs, setDragOverTabs] = useState(false);

  // Real-time Swiping Gesture Handler: tracks trackpad 1:1, allows continuous swiping across spaces
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const accumulatedDeltaX = useRef<number>(0);
  const lastCommitTimeRef = useRef<number>(0);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    // Only capture predominantly horizontal swipes
    if (Math.abs(e.deltaX) < 6 || Math.abs(e.deltaY) > Math.abs(e.deltaX) * 0.9) {
      return;
    }

    const now = Date.now();
    const elapsedSinceCommit = now - lastCommitTimeRef.current;

    // Reset visual offset when wheel events stop for 420ms (3x slower, relaxed easing)
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
    }
    gestureTimeoutRef.current = setTimeout(() => {
      accumulatedDeltaX.current = 0;
      setSwipeOffset(0);
      setIsSwiping(false);
    }, 420);

    // Lockout period scaled 3x (600ms) to ensure smooth, deliberate transitions
    if (elapsedSinceCommit < 600) {
      return;
    }

    setIsSwiping(true);
    accumulatedDeltaX.current -= e.deltaX * 0.85;
    const visualShift = Math.max(-40, Math.min(40, accumulatedDeltaX.current * 0.5));
    setSwipeOffset(visualShift);

    const threshold = 35; // Responsive, comfortable trackpad threshold

    if (accumulatedDeltaX.current < -threshold) {
      // Swiped left -> advance ONE space right
      lastCommitTimeRef.current = Date.now();
      accumulatedDeltaX.current = 0;
      setSwipeOffset(0);
      setIsSwiping(false);
      onSwipeSpace('right');
    } else if (accumulatedDeltaX.current > threshold) {
      // Swiped right -> advance ONE space left
      lastCommitTimeRef.current = Date.now();
      accumulatedDeltaX.current = 0;
      setSwipeOffset(0);
      setIsSwiping(false);
      onSwipeSpace('left');
    }
  };

  // Inline Space Renaming
  const [isEditingSpace, setIsEditingSpace] = useState(false);
  const [spaceNameInput, setSpaceNameInput] = useState('');
  const spaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingSpace) {
      spaceInputRef.current?.focus();
      spaceInputRef.current?.select();
    }
  }, [isEditingSpace]);

  const startEditingSpace = () => {
    setSpaceNameInput(currentSpace?.name || 'Personal');
    setIsEditingSpace(true);
  };

  const handleSaveSpaceName = () => {
    const trimmed = spaceNameInput.trim();
    if (trimmed && trimmed !== currentSpace?.name) {
      onRenameSpace(activeSpaceId, trimmed);
    }
    setIsEditingSpace(false);
  };

  const handleSpaceInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveSpaceName();
    } else if (e.key === 'Escape') {
      setIsEditingSpace(false);
    }
  };

  // Drag and Drop handlers for Pinned section
  const handlePinnedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPinned(true);
  };

  const handlePinnedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPinned(false);
    const tabId = e.dataTransfer.getData('text/plain');
    if (tabId) {
      onMoveTabToPinned(tabId);
    }
  };

  // Drag and Drop handlers for Tabs section
  const handleTabsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTabs(true);
  };

  const handleTabsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTabs(false);
    const tabId = e.dataTransfer.getData('text/plain');
    if (tabId) {
      onMoveTabToToday(tabId);
    }
  };

  // Render tabs grouping split pairs into horizontal SplitTabRow
  const renderTabList = (tabList: Tab[]) => {
    const renderedIds = new Set<string>();
    const elements: React.ReactNode[] = [];

    tabList.forEach((tab) => {
      if (renderedIds.has(tab.id)) return;

      if (tab.splitWithTabId) {
        const partner = tabList.find((t) => t.id === tab.splitWithTabId);
        if (partner) {
          renderedIds.add(tab.id);
          renderedIds.add(partner.id);
          const isPartnerLeft = splitLeftTabId === partner.id;
          const left = isPartnerLeft ? partner : tab;
          const right = isPartnerLeft ? tab : partner;
          elements.push(
            <SplitTabRow
              key={`split-${left.id}-${right.id}`}
              leftTab={left}
              rightTab={right}
              focusedTabId={activeTab?.id || ''}
              onSelectTab={onSelectTab}
              onCloseTab={onCloseTab}
              onUnsplit={(id) => (onUnsplitTab ? onUnsplitTab(id) : onSplitTabWith(id, id))}
            />
          );
          return;
        }
      }

      renderedIds.add(tab.id);
      elements.push(
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTab?.id}
          onSelect={() => onSelectTab(tab.id)}
          onClose={(e) => {
            e.stopPropagation();
            onCloseTab(tab.id);
          }}
          onTogglePin={(e) => {
            e.stopPropagation();
            onTogglePinTab(tab.id);
          }}
          onSplitScreen={() => onOpenSplitPicker()}
          onDropOnTab={(draggedId, targetId) => onSplitTabWith(draggedId, targetId)}
        />
      );
    });

    return elements;
  };

  return (
    <aside 
      className={`arc-sidebar ${isOpen ? 'open' : ''} ${isPinnedOpen ? 'pinned-open' : ''}`} 
      style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
      onWheel={handleWheel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Draggable resize handle */}
      <div 
        className={`sidebar-resizer ${isResizing ? 'is-resizing' : ''}`}
        onMouseDown={onStartResize}
      />

      {/* Top Navigation & Address Bar */}
      <TopNav
        activeTab={activeTab}
        isPinned={isPinnedOpen}
        onTogglePin={onTogglePin}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onReload={onReload}
        onNavigate={onNavigate}
      />

      {/* Space Viewport: Confines all space content strictly inside sidebar bounds */}
      <div className="sidebar-space-viewport">
        <div 
          key={currentSpace?.id}
          className="sidebar-space-content space-switch-animated"
          style={{
            transform: `translate3d(${swipeOffset}px, 0, 0)`,
            transition: isSwiping ? 'none' : 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Modern Space Name Header */}
          <div className="space-name-container">
            {isEditingSpace ? (
              <input
                ref={spaceInputRef}
                className="space-inline-edit-input"
                value={spaceNameInput}
                onChange={(e) => setSpaceNameInput(e.target.value)}
                onBlur={handleSaveSpaceName}
                onKeyDown={handleSpaceInputKeyDown}
              />
            ) : (
              <span 
                className="space-name-display"
                onClick={startEditingSpace}
              >
                {currentSpace?.name || 'Personal'}
              </span>
            )}
          </div>

          <div className="sidebar-scroll-area">
            {/* Pinned Tabs Section */}
            <div 
              className={`drag-drop-zone ${dragOverPinned ? 'drag-over' : ''}`}
              onDragOver={handlePinnedDragOver}
              onDragLeave={() => setDragOverPinned(false)}
              onDrop={handlePinnedDrop}
            >
              {pinnedTabs.length > 0 && (
                <div className="telemetry-section-header">
                  <span>Pinned</span>
                </div>
              )}

              {renderTabList(pinnedTabs)}
            </div>

            {pinnedTabs.length > 0 && <div className="sidebar-divider" />}

            {/* Tabs Section */}
            <div 
              className={`drag-drop-zone ${dragOverTabs ? 'drag-over' : ''}`}
              onDragOver={handleTabsDragOver}
              onDragLeave={() => setDragOverTabs(false)}
              onDrop={handleTabsDrop}
            >
              {/* Modern Action Row: New Tab + Clear */}
              <div className="tabs-header-row">
                <button className="add-tab-row" onClick={onNewTab} style={{ flex: 1, margin: 0 }}>
                  <Plus size={15} />
                  <span>New Tab</span>
                </button>
                <div className="tabs-quick-actions">
                  <button 
                    className="icon-action-btn" 
                    onClick={onClearTabs} 
                    title="Clear Tabs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Unpinned Tabs (including split pairs side-by-side) */}
              {renderTabList(unpinnedTabs)}
            </div>
          </div>
        </div>
      </div>

      {/* Spaces Bottom Dock */}
      <SpaceSwitcher
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        onSelectSpace={onSelectSpace}
        onAddSpace={onAddSpace}
        onRenameSpace={onRenameSpace}
        onDeleteSpace={onDeleteSpace}
        isPrivate={isPrivate}
        onOpenArchive={onOpenArchive}
        onOpenVault={onOpenVault}
        onOpenDownloads={onOpenDownloads}
        onOpenAbout={onOpenAbout}
        onOpenSettings={onOpenSettings}
        activeDownloadsCount={activeDownloadsCount}
        downloads={downloads}
        onDropTabOnSpace={onDropTabOnSpace}
      />
    </aside>
  );
};
