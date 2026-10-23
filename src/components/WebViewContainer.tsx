import React, { useEffect, useRef, useState } from 'react';
import { X, Columns2 } from 'lucide-react';
import { Tab } from '../types/browser';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FIREFOX_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0';

interface WebViewContainerProps {
  tabs: Tab[];
  activeTabId: string;
  isPrivate?: boolean;
  isSidebarOpen?: boolean;
  isSplitActive?: boolean;
  splitLeftTabId?: string | null;
  splitRightTabId?: string | null;
  onCloseSplit?: () => void;
  onDropToSplit?: (tabId: string) => void;
  onOpenSplitPicker?: () => void;
  onOpenNewTab?: (url: string) => void;
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void;
  registerWebviewRef: (tabId: string, el: any) => void;
}

export const WebViewContainer: React.FC<WebViewContainerProps> = ({
  tabs,
  activeTabId,
  isPrivate = false,
  isSidebarOpen = true,
  isSplitActive = false,
  splitLeftTabId,
  splitRightTabId,
  onCloseSplit,
  onDropToSplit,
  onOpenSplitPicker,
  onOpenNewTab,
  onUpdateTab,
  registerWebviewRef
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const leftTab = tabs.find((t) => t.id === splitLeftTabId);
  const rightTab = tabs.find((t) => t.id === splitRightTabId);

  const [isDragOverRight, setIsDragOverRight] = useState(false);
  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set of tabs that have been activated/mounted so they load once and stay in cache forever
  const [mountedTabIds, setMountedTabIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (activeTabId) initial.add(activeTabId);
    if (splitLeftTabId) initial.add(splitLeftTabId);
    if (splitRightTabId) initial.add(splitRightTabId);
    return initial;
  });

  useEffect(() => {
    setMountedTabIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      if (activeTabId && !next.has(activeTabId)) {
        next.add(activeTabId);
        changed = true;
      }
      if (isSplitActive) {
        if (splitLeftTabId && !next.has(splitLeftTabId)) {
          next.add(splitLeftTabId);
          changed = true;
        }
        if (splitRightTabId && !next.has(splitRightTabId)) {
          next.add(splitRightTabId);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeTabId, isSplitActive, splitLeftTabId, splitRightTabId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverRight(true);
  };

  const handleDragLeave = () => {
    setIsDragOverRight(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverRight(false);
    const tabId = e.dataTransfer.getData('text/plain');
    if (tabId && tabId !== activeTabId && onDropToSplit) {
      onDropToSplit(tabId);
    }
  };

  const handleStartSplitResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSplit(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = moveEvent.clientX - rect.left;
      const rawRatio = offsetX / rect.width;
      const clampedRatio = Math.max(0.18, Math.min(0.82, rawRatio));
      setSplitRatio(clampedRatio);
    };

    const onMouseUp = () => {
      setIsResizingSplit(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className="webview-holder"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      {/* Global transparent drag overlay while resizing split view */}
      {isResizingSplit && (
        <div className="resizing-global-overlay" style={{ cursor: 'col-resize' }} />
      )}

      {activeTab?.isLoading && <div className="web-loading-line" />}

      {/* Modern Split Screen Control Pill when active */}
      {isSplitActive && (
        <div className="split-active-control-pill">
          {onOpenSplitPicker && (
            <button 
              className="split-change-tab-btn"
              onClick={onOpenSplitPicker}
              title="Change Right Tab"
            >
              <Columns2 size={13} />
              <span className="split-tab-pill-title">{rightTab?.title || 'Split Tab'}</span>
            </button>
          )}

          <div className="split-pill-divider" />

          {/* Dedicated Separate Tabs Button */}
          <button 
            className="split-separate-tabs-btn"
            onClick={onCloseSplit}
            title="Separate tabs into individual tabs"
          >
            <Columns2 size={12} />
            <span>Separate</span>
          </button>

          <button 
            className="split-exit-btn" 
            onClick={onCloseSplit}
            title="Exit Split Screen (Separate Tabs)"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Visual Drop to Split Screen Indicator */}
      {isDragOverRight && !isSplitActive && (
        <div className="viewport-split-drop-zone">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Columns2 size={20} />
            <span>Drop here to Split</span>
          </div>
        </div>
      )}

      {/* Thin Visible Black Liquid Padding / Resizer between Split Screens */}
      {isSplitActive && (
        <div 
          className={`liquid-glass-split-resizer ${isResizingSplit ? 'active' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `calc(${splitRatio * 100}% - 4px)`,
            width: '8px',
            zIndex: 45
          }}
          onMouseDown={handleStartSplitResize}
          title="Drag to resize split"
        >
          <div className="liquid-glass-split-hairline" />
        </div>
      )}

      {/* All visited tabs stay permanently mounted in memory with constant key */}
      {tabs.map((tab) => {
        if (!mountedTabIds.has(tab.id)) {
          return null;
        }

        let isVisible = false;
        let paneStyle: React.CSSProperties = {
          position: 'absolute',
          inset: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          transform: 'translate3d(-10000px, 0, 0)',
          backgroundColor: '#000000'
        };

        if (isSplitActive) {
          if (tab.id === splitLeftTabId) {
            isVisible = true;
            paneStyle = {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: `calc(${splitRatio * 100}% - 4px)`,
              display: 'flex',
              visibility: 'visible',
              pointerEvents: 'auto',
              transform: 'none',
              borderRadius: '0',
              overflow: 'hidden',
              backgroundColor: '#000000',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            };
          } else if (tab.id === splitRightTabId) {
            isVisible = true;
            paneStyle = {
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: `calc(${(1 - splitRatio) * 100}% - 4px)`,
              display: 'flex',
              visibility: 'visible',
              pointerEvents: 'auto',
              transform: 'none',
              borderRadius: '0',
              overflow: 'hidden',
              backgroundColor: '#000000',
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            };
          }
        } else {
          if (tab.id === activeTabId) {
            isVisible = true;
            paneStyle = {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              visibility: 'visible',
              pointerEvents: 'auto',
              transform: 'none',
              borderRadius: '0',
              overflow: 'hidden',
              backgroundColor: '#000000'
            };
          }
        }

        return (
          <div 
            key={tab.id}
            className="tab-webview-pane"
            style={paneStyle}
          >
            <WebViewItem
              tab={tab}
              isActive={isVisible}
              isPrivate={isPrivate}
              isSidebarOpen={isSidebarOpen}
              onOpenNewTab={onOpenNewTab}
              onUpdateTab={(updates) => onUpdateTab(tab.id, updates)}
              registerWebviewRef={(el) => registerWebviewRef(tab.id, el)}
            />
          </div>
        );
      })}
    </div>
  );
};

interface WebViewItemProps {
  tab: Tab;
  isActive: boolean;
  isPrivate?: boolean;
  isSidebarOpen?: boolean;
  onOpenNewTab?: (url: string) => void;
  onUpdateTab: (updates: Partial<Tab>) => void;
  registerWebviewRef: (el: any) => void;
}

const WebViewItem: React.FC<WebViewItemProps> = ({
  tab,
  isActive,
  isPrivate = false,
  isSidebarOpen = true,
  onOpenNewTab,
  onUpdateTab,
  registerWebviewRef
}) => {
  const webviewRef = useRef<any>(null);
  // Freeze the initial URL so React JSX never mutates the DOM 'src' attribute on re-renders,
  // which previously triggered Electron's attributeChangedCallback and caused constant auto-refreshing!
  const initialUrl = useRef<string>(tab.url);
  const currentLoadedUrl = useRef<string>(tab.url);

  // Imperatively navigate only when tab.url was changed externally (e.g. from Address Bar / Command Bar)
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    if (tab.url && tab.url !== currentLoadedUrl.current) {
      currentLoadedUrl.current = tab.url;
      if (webview.loadURL) {
        webview.loadURL(tab.url);
      }
    }
  }, [tab.url]);

  // Synchronize sidebar visibility and history state with guest webview
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    try {
      const canBack = webview.canGoBack ? webview.canGoBack() : false;
      const canFwd = webview.canGoForward ? webview.canGoForward() : false;
      if (webview.send) {
        webview.send('set-sidebar-open', isSidebarOpen);
        webview.send('update-history-state', { canGoBack: canBack, canGoForward: canFwd });
      }
      if (webview.contentWindow && webview.contentWindow.postMessage) {
        webview.contentWindow.postMessage({ type: '__ARCO_SIDEBAR_STATE__', isOpen: isSidebarOpen }, '*');
        webview.contentWindow.postMessage({ type: '__ARCO_HISTORY_STATE__', canGoBack: canBack, canGoForward: canFwd }, '*');
      }
    } catch {}
  }, [isSidebarOpen]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const isGoogleAuth = tab.url && (tab.url.includes('accounts.google.com') || tab.url.includes('accounts.youtube.com'));
    const targetUA = isGoogleAuth ? FIREFOX_USER_AGENT : CHROME_USER_AGENT;

    if (webview.setUserAgent) {
      try {
        webview.setUserAgent(targetUA);
      } catch {}
    } else {
      webview.onload = () => {
        try {
          if (webview.setUserAgent) webview.setUserAgent(targetUA);
        } catch {}
      };
    }
  }, [tab.url]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    registerWebviewRef(webview);

    const handleStartLoading = () => {
      onUpdateTab({ isLoading: true });
    };

    const syncHistoryState = () => {
      try {
        const canBack = webview.canGoBack ? webview.canGoBack() : false;
        const canFwd = webview.canGoForward ? webview.canGoForward() : false;
        if (webview.send) {
          webview.send('update-history-state', { canGoBack: canBack, canGoForward: canFwd });
        }
        if (webview.contentWindow && webview.contentWindow.postMessage) {
          webview.contentWindow.postMessage({ type: '__ARCO_HISTORY_STATE__', canGoBack: canBack, canGoForward: canFwd }, '*');
        }
      } catch {}
    };

    const handleStopLoading = () => {
      const canBack = webview.canGoBack ? webview.canGoBack() : false;
      const canFwd = webview.canGoForward ? webview.canGoForward() : false;
      onUpdateTab({
        isLoading: false,
        canGoBack: canBack,
        canGoForward: canFwd
      });
      syncHistoryState();
    };

    const handleTitleUpdated = (e: any) => {
      if (e.title) {
        onUpdateTab({ title: e.title });
      }
    };

    const handleFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0) {
        onUpdateTab({ favicon: e.favicons[0] });
      }
    };

    const handleNavigate = (e: any) => {
      if (e.url) {
        currentLoadedUrl.current = e.url;
        const canBack = webview.canGoBack ? webview.canGoBack() : false;
        const canFwd = webview.canGoForward ? webview.canGoForward() : false;
        onUpdateTab({
          url: e.url,
          canGoBack: canBack,
          canGoForward: canFwd
        });
        syncHistoryState();
      }
    };

    const handleFailLoad = (e: any) => {
      if (e.errorCode === -3) return;
      onUpdateTab({ isLoading: false });
    };

    const handleNewWindow = (e: any) => {
      e.preventDefault();
      if (e.url) {
        onOpenNewTab?.(e.url);
      }
    };

    const handleIpcMessage = (e: any) => {
      if (e.channel === 'navigate-back') {
        try {
          if (webview.canGoBack && webview.canGoBack()) {
            webview.goBack();
          } else if (typeof webview.goBack === 'function') {
            webview.goBack();
          }
        } catch (err) {}
      } else if (e.channel === 'navigate-forward') {
        try {
          if (webview.canGoForward && webview.canGoForward()) {
            webview.goForward();
          } else if (typeof webview.goForward === 'function') {
            webview.goForward();
          }
        } catch (err) {}
      }
    };

    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('did-stop-loading', handleStopLoading);
    webview.addEventListener('page-title-updated', handleTitleUpdated);
    webview.addEventListener('page-favicon-updated', handleFaviconUpdated);
    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    webview.addEventListener('did-fail-load', handleFailLoad);
    webview.addEventListener('new-window', handleNewWindow);
    webview.addEventListener('ipc-message', handleIpcMessage);
    webview.addEventListener('dom-ready', syncHistoryState);

    return () => {
      try {
        webview.removeEventListener('did-start-loading', handleStartLoading);
        webview.removeEventListener('did-stop-loading', handleStopLoading);
        webview.removeEventListener('page-title-updated', handleTitleUpdated);
        webview.removeEventListener('page-favicon-updated', handleFaviconUpdated);
        webview.removeEventListener('did-navigate', handleNavigate);
        webview.removeEventListener('did-navigate-in-page', handleNavigate);
        webview.removeEventListener('did-fail-load', handleFailLoad);
        webview.removeEventListener('new-window', handleNewWindow);
        webview.removeEventListener('ipc-message', handleIpcMessage);
        webview.removeEventListener('dom-ready', syncHistoryState);
      } catch {}
    };
  }, []);

  const stealthPreload = (window as any).electronAPI?.stealthPreloadPath;

  return (
    <webview
      ref={webviewRef}
      className={`webview-item ${isActive ? 'active' : ''}`}
      src={initialUrl.current}
      partition={isPrivate ? "inmemory:private_session" : "persist:arco_main"}
      preload={stealthPreload}
      // @ts-ignore
      allowpopups="true"
      // @ts-ignore
      webpreferences="contextIsolation=yes, nodeIntegration=no, disableBlinkFeatures=AutomationControlled"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000'
      }}
    />
  );
};
