import React, { useEffect, useRef, useState } from 'react';
import { X, Columns2, Snowflake } from 'lucide-react';
import { Tab } from '../types/browser';

const CHROME_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FIREFOX_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0';

interface WebViewContainerProps {
  tabs: Tab[];
  activeTabId: string;
  isPrivate?: boolean;
  onEdgeHover?: () => void;
  isSidebarOpen?: boolean;
  isSplitActive?: boolean;
  splitLeftTabId?: string | null;
  splitRightTabId?: string | null;
  onCloseSplit?: () => void;
  onDropToSplit?: (tabId: string) => void;
  onOpenSplitPicker?: () => void;
  onOpenNewTab?: (url: string) => void;
  onUpdateTab: (tabId: string, updates: Partial<Tab>) => void;
  onCloseTab?: (tabId: string) => void;
  registerWebviewRef: (tabId: string, el: any) => void;
  onMediaStateChange?: (tabId: string, media: any) => void;
}

const FrozenTabPane: React.FC<{
  tab: Tab;
  paneStyle: React.CSSProperties;
  onAwaken: () => void;
  onClose: () => void;
}> = ({ tab, paneStyle, onAwaken, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div 
      className="tab-webview-pane frozen-tab-pane"
      style={paneStyle}
      onClick={onAwaken}
    >
      <div className="frozen-pane-card" onClick={(e) => e.stopPropagation()}>
        <div className="frozen-pane-icon">
          <Snowflake size={30} />
        </div>
        <h3 className="frozen-pane-title">{tab.title || 'Untitled Tab'}</h3>
        <div className="frozen-pane-url">{tab.url}</div>
        <div className="frozen-pane-desc">
          Unawakened Tab • If you choose not to awaken it, Lor will automatically close it in {secondsLeft}s.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
          <button 
            type="button"
            className="frozen-pane-btn"
            onClick={onAwaken}
          >
            Awaken Tab
          </button>
          <button 
            type="button"
            className="frozen-pane-btn-close"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: '#a1a1aa',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
          >
            Close Tab
          </button>
        </div>
      </div>
    </div>
  );
};

export const WebViewContainer: React.FC<WebViewContainerProps> = ({
  tabs,
  activeTabId,
  isPrivate = false,
  onEdgeHover,
  isSidebarOpen = true,
  isSplitActive = false,
  splitLeftTabId,
  splitRightTabId,
  onCloseSplit,
  onDropToSplit,
  onOpenSplitPicker,
  onOpenNewTab,
  onUpdateTab,
  onCloseTab,
  registerWebviewRef,
  onMediaStateChange
}) => {
  // Bulletproof fallback: ensure there is ALWAYS a valid active tab selected
  const effectiveActiveTabId = tabs.some((t) => t.id === activeTabId)
    ? activeTabId
    : (tabs[0]?.id || '');

  const activeTab = tabs.find((t) => t.id === effectiveActiveTabId);
  const leftTab = tabs.find((t) => t.id === splitLeftTabId);
  const rightTab = tabs.find((t) => t.id === splitRightTabId);

  const [isDragOverRight, setIsDragOverRight] = useState(false);
  const [splitRatio, setSplitRatio] = useState<number>(0.5);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set of tabs that have been activated/mounted so they load once and stay in cache forever
  const [mountedTabIds, setMountedTabIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (effectiveActiveTabId) initial.add(effectiveActiveTabId);
    if (splitLeftTabId) initial.add(splitLeftTabId);
    if (splitRightTabId) initial.add(splitRightTabId);
    return initial;
  });

  // Guarantee that effectiveActiveTabId and split tabs are included synchronously on the current render frame
  if (effectiveActiveTabId && !mountedTabIds.has(effectiveActiveTabId)) {
    mountedTabIds.add(effectiveActiveTabId);
  }
  if (isSplitActive) {
    if (splitLeftTabId && !mountedTabIds.has(splitLeftTabId)) mountedTabIds.add(splitLeftTabId);
    if (splitRightTabId && !mountedTabIds.has(splitRightTabId)) mountedTabIds.add(splitRightTabId);
  }

  useEffect(() => {
    setMountedTabIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      if (effectiveActiveTabId && !next.has(effectiveActiveTabId)) {
        next.add(effectiveActiveTabId);
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
  }, [effectiveActiveTabId, isSplitActive, splitLeftTabId, splitRightTabId]);

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

      {activeTab?.isLoading && (
        <div className="web-loading-line" />
      )}

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
          if (tab.id === effectiveActiveTabId) {
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

        if (tab.isFrozen) {
          return (
            <FrozenTabPane
              key={tab.id}
              tab={tab}
              paneStyle={paneStyle}
              onAwaken={() => onUpdateTab(tab.id, { isFrozen: false, lastActiveAt: Date.now() })}
              onClose={() => onCloseTab?.(tab.id)}
            />
          );
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
              onEdgeHover={onEdgeHover}
              isSidebarOpen={isSidebarOpen}
              onOpenNewTab={onOpenNewTab}
              onUpdateTab={(updates) => onUpdateTab(tab.id, updates)}
              registerWebviewRef={(el) => registerWebviewRef(tab.id, el)}
              onMediaStateChange={onMediaStateChange}
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
  onEdgeHover?: () => void;
  isSidebarOpen?: boolean;
  onOpenNewTab?: (url: string) => void;
  onUpdateTab: (updates: Partial<Tab>) => void;
  onCloseTab?: (tabId: string) => void;
  registerWebviewRef: (el: any) => void;
  onMediaStateChange?: (tabId: string, media: any) => void;
}

const WebViewItem: React.FC<WebViewItemProps> = ({
  tab,
  isActive,
  isPrivate = false,
  onEdgeHover,
  isSidebarOpen = true,
  onOpenNewTab,
  onUpdateTab,
  onCloseTab,
  registerWebviewRef,
  onMediaStateChange
}) => {
  const webviewRef = useRef<any>(null);
  // Freeze the initial URL so React JSX never mutates the DOM 'src' attribute on re-renders,
  // which previously triggered Electron's attributeChangedCallback and caused constant auto-refreshing!
  const initialUrl = useRef<string>(tab.url);
  const currentLoadedUrl = useRef<string>(tab.url);
  const loadingTimeoutRef = useRef<any>(null);
  const mediaSyncTimerRef = useRef<any>(null);

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
      let canGoBack = false;
      let canGoForward = false;
      try {
        canGoBack = typeof webview.canGoBack === 'function' ? webview.canGoBack() : false;
        canGoForward = typeof webview.canGoForward === 'function' ? webview.canGoForward() : false;
      } catch {}
      if (typeof webview.send === 'function') {
        webview.send('set-sidebar-open', isSidebarOpen);
        webview.send('update-history-state', { canGoBack, canGoForward });
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

    const clearLoading = () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      onUpdateTab({ isLoading: false });
    };

    const handleStartLoading = () => {
      onUpdateTab({ isLoading: true });
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      // Failsafe: never leave isLoading true indefinitely for SPAs with continuous background connections
      loadingTimeoutRef.current = setTimeout(() => {
        onUpdateTab({ isLoading: false });
      }, 2500);
    };

    const syncHistoryState = () => {
      try {
        let canGoBack = false;
        let canGoForward = false;
        try {
          canGoBack = typeof webview.canGoBack === 'function' ? webview.canGoBack() : false;
          canGoForward = typeof webview.canGoForward === 'function' ? webview.canGoForward() : false;
        } catch {}
        if (typeof webview.send === 'function') {
          webview.send('update-history-state', { canGoBack, canGoForward });
        }
      } catch {}
    };

    const handleStopLoading = () => {
      clearLoading();
      let canGoBack = false;
      let canGoForward = false;
      try {
        canGoBack = typeof webview.canGoBack === 'function' ? webview.canGoBack() : false;
        canGoForward = typeof webview.canGoForward === 'function' ? webview.canGoForward() : false;
      } catch {}
      onUpdateTab({
        isLoading: false,
        canGoBack,
        canGoForward
      });
      syncHistoryState();
    };

    const handleDomReady = () => {
      clearLoading();
      syncHistoryState();
    };

    const handleFinishLoad = () => {
      clearLoading();
      syncHistoryState();
    };

    const handleTitleUpdated = (e: any) => {
      if (e.title) {
        onUpdateTab({ title: e.title, isLoading: false });
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
        let canGoBack = false;
        let canGoForward = false;
        try {
          canGoBack = typeof webview.canGoBack === 'function' ? webview.canGoBack() : false;
          canGoForward = typeof webview.canGoForward === 'function' ? webview.canGoForward() : false;
        } catch {}
        onUpdateTab({
          url: e.url,
          canGoBack,
          canGoForward
        });
        syncHistoryState();
      }
    };

    const handleFailLoad = (e: any) => {
      if (e.errorCode === -3) return;
      onUpdateTab({ isLoading: false });
    };

    const handleRenderProcessGone = (e: any) => {
      console.warn('[WebView] Render process gone for tab:', tab.id, e?.reason);
      onUpdateTab({ isLoading: false });
      if (e?.reason !== 'clean-exit' && typeof webview.reload === 'function') {
        try { webview.reload(); } catch {}
      }
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
          if (typeof webview.canGoBack === 'function' && webview.canGoBack()) {
            webview.goBack();
          }
        } catch (err) {}
      } else if (e.channel === 'navigate-forward') {
        try {
          if (typeof webview.canGoForward === 'function' && webview.canGoForward()) {
            webview.goForward();
          }
        } catch (err) {}
      } else if (e.channel === 'edge-hover-left') {
        onEdgeHover?.();
      }
    };

    const queryAndBroadcastMedia = () => {
      try {
        if (!webview) return;
        if (typeof webview.isLoading === 'function' && webview.isLoading()) return;
        webview.executeJavaScript(`
          (function() {
            try {
              const v = document.querySelector('video.html5-main-video') || document.querySelector('video') || document.querySelector('audio');
              if (!v) return null;
              return {
                hasMedia: true,
                isPlaying: !v.paused && !v.ended,
                mediaType: v.tagName.toLowerCase(),
                currentTime: v.currentTime || 0,
                duration: isFinite(v.duration) ? v.duration : 0,
                title: (document.title || 'Playing Media').replace(/ - YouTube$/, ''),
                domain: window.location.hostname.replace(/^www\\./, ''),
                url: window.location.href,
                tabId: ${JSON.stringify(tab.id)}
              };
            } catch(e) { return null; }
          })()
        `).then((media: any) => {
          if (media && onMediaStateChange) {
            onMediaStateChange(tab.id, media);
          }
        }).catch(() => {});
      } catch {}
    };

    const handleMediaStarted = () => {
      queryAndBroadcastMedia();
      if (mediaSyncTimerRef.current) clearInterval(mediaSyncTimerRef.current);
      mediaSyncTimerRef.current = setInterval(queryAndBroadcastMedia, 750);
    };

    const handleMediaPaused = () => {
      if (mediaSyncTimerRef.current) {
        clearInterval(mediaSyncTimerRef.current);
        mediaSyncTimerRef.current = null;
      }
      if (onMediaStateChange) {
        onMediaStateChange(tab.id, { isPlaying: false, tabId: tab.id });
      }
    };

    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('did-stop-loading', handleStopLoading);
    webview.addEventListener('did-finish-load', handleFinishLoad);
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('page-title-updated', handleTitleUpdated);
    webview.addEventListener('page-favicon-updated', handleFaviconUpdated);
    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    webview.addEventListener('did-fail-load', handleFailLoad);
    webview.addEventListener('render-process-gone', handleRenderProcessGone);
    webview.addEventListener('new-window', handleNewWindow);
    webview.addEventListener('ipc-message', handleIpcMessage);
    webview.addEventListener('media-started-playing', handleMediaStarted);
    webview.addEventListener('media-paused', handleMediaPaused);

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (mediaSyncTimerRef.current) clearInterval(mediaSyncTimerRef.current);
      try {
        webview.removeEventListener('did-start-loading', handleStartLoading);
        webview.removeEventListener('did-stop-loading', handleStopLoading);
        webview.removeEventListener('did-finish-load', handleFinishLoad);
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('page-title-updated', handleTitleUpdated);
        webview.removeEventListener('page-favicon-updated', handleFaviconUpdated);
        webview.removeEventListener('did-navigate', handleNavigate);
        webview.removeEventListener('did-navigate-in-page', handleNavigate);
        webview.removeEventListener('did-fail-load', handleFailLoad);
        webview.removeEventListener('render-process-gone', handleRenderProcessGone);
        webview.removeEventListener('new-window', handleNewWindow);
        webview.removeEventListener('ipc-message', handleIpcMessage);
        webview.removeEventListener('media-started-playing', handleMediaStarted);
        webview.removeEventListener('media-paused', handleMediaPaused);
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
