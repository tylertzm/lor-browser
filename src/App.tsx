import React, { useState, useEffect, useRef } from 'react';
import { Shield, Layers, ChevronUp } from 'lucide-react';
import { Tab, Space, HistoryItem, DownloadItem, VaultTabItem } from './types/browser';
import { Sidebar } from './components/Sidebar';
import { WebViewContainer } from './components/WebViewContainer';
import { HistoryArchive } from './components/HistoryArchive';
import { DownloadsManager } from './components/DownloadsManager';
import { CommandBar } from './components/CommandBar';
import { SplitTabPicker } from './components/SplitTabPicker';
import { AboutModal } from './components/AboutModal';
import { SettingsModal, SettingsTabId } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { TabVaultModal } from './components/TabVaultModal';
import { LorCoreAssistant } from './components/LorCoreAssistant';
import { LiquidGlassWorkflowOverlay } from './components/LiquidGlassWorkflowOverlay';
import './styles/arc.css';

const INITIAL_SPACES: Space[] = [
  { id: 'space-personal', name: 'Personal', themeColor: '#ffffff' },
  { id: 'space-work', name: 'Work', themeColor: '#ffffff' },
  { id: 'space-labs', name: 'Labs', themeColor: '#ffffff' }
];

const INITIAL_TABS: Tab[] = [
  {
    id: 'tab-google-default',
    title: 'Google',
    url: 'https://www.google.com',
    favicon: 'https://www.google.com/favicon.ico',
    pinned: false,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    spaceId: 'space-personal'
  },
  {
    id: 'tab-work-default',
    title: 'Google',
    url: 'https://www.google.com',
    favicon: 'https://www.google.com/favicon.ico',
    pinned: false,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    spaceId: 'space-work'
  },
  {
    id: 'tab-labs-default',
    title: 'Google',
    url: 'https://www.google.com',
    favicon: 'https://www.google.com/favicon.ico',
    pinned: false,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    spaceId: 'space-labs'
  }
];

const cleanTabTitle = (title: string): string => {
  if (!title) return 'New Tab';
  return title
    .replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, '')
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '')
    .replace(/\s*-\s*Wikipedia$/, '')
    .replace(/\s*\(decorative\)/, '')
    .replace(/\.net\s*-\s*Anime and Manga Database/, '')
    .replace(/\s*-\s*Fitness & Nutrition/, '')
    .replace(/\s*-\s*Restaurants Berlin/, '')
    .replace(/Application Security Verification Standard/, 'ASVS')
    .replace(/\s*Whiteboard/, '')
    .replace(/\s*-\s*GitHub/, '')
    .replace(/\s*\|\s*The browser for better days at work\./, '')
    .replace(/\s*-\s*The Browser Company/, '')
    .replace(/\s*-\s*Secure Email/, '')
    .replace(/\s*Repositories/, '')
    .replace(/\s*Workspace/, '')
    .replace(/\s*-\s*Models & Datasets/, '')
    .replace(/\s*AI$/, '')
    .trim() || title;
};

export const App: React.FC = () => {
  const isPrivate = useRef(
    new URLSearchParams(window.location.search).get('private') === '1' ||
    window.location.hash.includes('private')
  ).current;

  const [spaces, setSpaces] = useState<Space[]>(() => {
    if (isPrivate) return INITIAL_SPACES;
    const saved = localStorage.getItem('arco_spaces');
    return saved ? JSON.parse(saved) : INITIAL_SPACES;
  });

  const [activeSpaceId, setActiveSpaceId] = useState<string>(() => {
    if (isPrivate) return 'space-personal';
    return localStorage.getItem('arco_active_space') || 'space-personal';
  });

  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (isPrivate) return INITIAL_TABS;
    const saved = localStorage.getItem('arco_tabs');
    if (saved) {
      try {
        const parsed: Tab[] = JSON.parse(saved);
        const hasLegacyDemo = parsed.some((t) => t.id === 'tab-p1' || t.id === 'tab-p2' || t.id === 'tab-w1');
        if (!hasLegacyDemo && parsed.length > 0) {
          return parsed.map((t) => ({ ...t, title: cleanTabTitle(t.title) }));
        }
      } catch {}
    }
    return INITIAL_TABS;
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (isPrivate) return [];
    try {
      const saved = localStorage.getItem('arco_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem('arco_downloads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('appearance');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lor_theme') as 'dark' | 'light') || 'dark';
  });
  const [searchEngine, setSearchEngine] = useState<string>(() => {
    return localStorage.getItem('lor_search_engine') || 'google';
  });

  useEffect(() => {
    try {
      localStorage.setItem('lor_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
        document.body.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.body.classList.remove('light-mode');
      }
    } catch {}
  }, [theme]);

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    if (isPrivate) return false;
    return !localStorage.getItem('lor_onboarding_v2_completed');
  });

  useEffect(() => {
    try {
      localStorage.setItem('arco_downloads', JSON.stringify(downloads));
    } catch {}
  }, [downloads]);

  useEffect(() => {
    if ((window as any).electronAPI?.onDownloadUpdated) {
      return (window as any).electronAPI.onDownloadUpdated((updatedItem: DownloadItem) => {
        setDownloads((prev) => {
          const idx = prev.findIndex((d) => d.id === updatedItem.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updatedItem };
            return next;
          } else {
            return [updatedItem, ...prev];
          }
        });
      });
    }
  }, []);

  // Fetch recent files from user's system Downloads folder on startup
  useEffect(() => {
    if ((window as any).electronAPI?.getRecentDownloads) {
      (window as any).electronAPI.getRecentDownloads().then((recent: DownloadItem[]) => {
        if (recent && recent.length > 0) {
          setDownloads((prev) => {
            const existingPaths = new Set(prev.map((d) => d.savePath));
            const toAdd = recent.filter((r) => !existingPaths.has(r.savePath));
            return [...prev, ...toAdd];
          });
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if ((window as any).electronAPI?.onPopupAsTab) {
      return (window as any).electronAPI.onPopupAsTab((url: string) => {
        if (url && url !== 'about:blank') {
          handleCreateTab(url, false);
        }
      });
    }
  }, [activeSpaceId]);

  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [commandBarMode, setCommandBarMode] = useState<'new-tab' | 'edit-url'>('new-tab');
  const [splitPickerOpen, setSplitPickerOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [lorAssistantEnabled, setLorAssistantEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lor_assistant_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleLorAssistant = (enabled: boolean) => {
    setLorAssistantEnabled(enabled);
    try {
      localStorage.setItem('lor_assistant_enabled', String(enabled));
    } catch {}
  };
  const [quickChatTrigger, setQuickChatTrigger] = useState<number>(0);
  const [snipTrigger, setSnipTrigger] = useState<number>(0);
  const [workflowCanvasOpen, setWorkflowCanvasOpen] = useState<boolean>(false);
  const [workflowCanvasPreset, setWorkflowCanvasPreset] = useState<'school-lms' | 'social-media' | 'student-email' | 'github-prs' | 'hotel-research' | 'custom'>('school-lms');
  const [bottomHovered, setBottomHovered] = useState<boolean>(false);
  const bottomIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHalfMoonCharging, setIsHalfMoonCharging] = useState<boolean>(false);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // LorFlow crescent pops up only when mouse enters the bottom 2% of display
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const bottomThreshold = window.innerHeight * 0.98; // bottom 2%
      if (e.clientY >= bottomThreshold) {
        setBottomHovered(true);
      } else {
        // Only retract if mouse leaves the trigger area and not actively charging
        if (e.clientY < window.innerHeight - 56 && !isHalfMoonCharging) {
          setBottomHovered(false);
        }
      }
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, [isHalfMoonCharging]);

  const handleHalfMoonMouseEnter = () => {
    setIsHalfMoonCharging(true);
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    // Only come up after charging the whole circumference when mouse doesn't leave!
    chargeTimerRef.current = setTimeout(() => {
      setIsHalfMoonCharging(false);
      setWorkflowCanvasOpen(true);
      chargeTimerRef.current = null;
    }, 750);
  };

  const handleHalfMoonMouseLeave = () => {
    setIsHalfMoonCharging(false);
    if (chargeTimerRef.current) {
      clearTimeout(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
  };

  const handleHalfMoonClick = () => {
    if (chargeTimerRef.current) {
      clearTimeout(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
    setIsHalfMoonCharging(false);
    setWorkflowCanvasOpen((prev) => !prev);
  };

  const handleOpenWorkflowCanvas = (preset?: 'school-lms' | 'social-media' | 'student-email' | 'github-prs' | 'hotel-research' | 'custom') => {
    if (preset) setWorkflowCanvasPreset(preset);
    setWorkflowCanvasOpen(true);
  };

  const handleCloseWorkflowCanvas = () => {
    setWorkflowCanvasOpen(false);
    setBottomHovered(false);
    setIsHalfMoonCharging(false);
    if (chargeTimerRef.current) {
      clearTimeout(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
    if (bottomIntentTimerRef.current) {
      clearTimeout(bottomIntentTimerRef.current);
      bottomIntentTimerRef.current = null;
    }
  };

  const handleOpenQuickChat = () => {
    setAssistantOpen(true);
    setQuickChatTrigger((prev) => prev + 1);
  };

  const [sidebarHovered, setSidebarHovered] = useState(false); // Only shows when mouse hovers to the left edge of the screen
  const [sidebarPinnedOpen, setSidebarPinnedOpen] = useState<boolean>(false);
  // Strict mode: sidebar is shown ONLY when mouse is hovering the end edge or inside sidebar
  const isSidebarOpen = sidebarHovered;

  const handleTogglePinSidebar = () => {
    setSidebarHovered((prev) => !prev);
  };

  // Persistent split order map: records which tab is on the left and right in each pair
  const [splitOrderMap, setSplitOrderMap] = useState<Record<string, { leftTabId: string; rightTabId: string }>>(() => {
    try {
      const saved = localStorage.getItem('lor_split_orders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom Sidebar Width & Draggable Resizing (Default: 35% of screen width)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const default35Percent = Math.round(window.innerWidth * 0.35);
    const saved = localStorage.getItem('arco_sidebar_width');
    return saved ? Math.max(240, Math.min(Math.round(window.innerWidth * 0.7), parseInt(saved, 10))) : default35Percent;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      const maxAllowed = Math.min(900, window.innerWidth * 0.7);
      const newWidth = Math.max(240, Math.min(maxAllowed, moveEvent.clientX));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      const maxAllowed = Math.min(900, window.innerWidth * 0.7);
      const finalWidth = Math.max(240, Math.min(maxAllowed, upEvent.clientX));
      setSidebarWidth(finalWidth);
      if (!isPrivate) {
        localStorage.setItem('arco_sidebar_width', String(finalWidth));
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Debounced auto-collapse and 15% edge hover tracking
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSidebarMouseEnter = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setSidebarHovered(true);
  };

  const handleSidebarMouseLeave = () => {
    if (isResizing) return;
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    collapseTimerRef.current = setTimeout(() => {
      setSidebarHovered(false);
      collapseTimerRef.current = null;
    }, 100);
  };

  // Automatic Screen Edge Hover Reveal: Strictly reveals sidebar ONLY at absolute screen edge (<= 2px)
  const openIntentTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem('arco_sidebar_pinned');
    } catch {}

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isResizing) return;

      // If workflow canvas is currently open, do not trigger edge sidebar peek
      if (workflowCanvasOpen) {
        return;
      }

      // Absolute physical edge of the display (<= 2px)
      if (e.clientX <= 2) {
        if (collapseTimerRef.current) {
          clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = null;
        }
        // Require intentional 200ms dwell at the absolute edge
        if (!sidebarHovered && !openIntentTimerRef.current) {
          openIntentTimerRef.current = setTimeout(() => {
            setSidebarHovered(true);
            openIntentTimerRef.current = null;
          }, 200);
        }
      } else {
        // Cursor moved away from absolute edge: cancel pending open
        if (openIntentTimerRef.current) {
          clearTimeout(openIntentTimerRef.current);
          openIntentTimerRef.current = null;
        }

        if (e.clientX > sidebarWidth) {
          // Moving cursor away from the open sidebar
          if (!collapseTimerRef.current && sidebarHovered) {
            collapseTimerRef.current = setTimeout(() => {
              setSidebarHovered(false);
              collapseTimerRef.current = null;
            }, 80);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      if (openIntentTimerRef.current) {
        clearTimeout(openIntentTimerRef.current);
        openIntentTimerRef.current = null;
      }
      if (bottomIntentTimerRef.current) {
        clearTimeout(bottomIntentTimerRef.current);
        bottomIntentTimerRef.current = null;
      }
    };
  }, [sidebarWidth, isResizing, sidebarHovered, bottomHovered]);

  const [spaceActiveTabMap, setSpaceActiveTabMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('arco_space_active_tabs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'space-personal': 'tab-google-default',
      'space-work': 'tab-work-default',
      'space-labs': 'tab-labs-default'
    };
  });

  useEffect(() => {
    if (isPrivate) return;
    try {
      localStorage.setItem('arco_space_active_tabs', JSON.stringify(spaceActiveTabMap));
    } catch {}
  }, [spaceActiveTabMap, isPrivate]);

  // Bulletproof activeTabId resolution: must exist in current space, or fall back to any valid tab
  const currentSpaceTabs = tabs.filter((t) => t.spaceId === activeSpaceId);
  const preferredTabId = spaceActiveTabMap[activeSpaceId];
  const activeTabExists = currentSpaceTabs.some((t) => t.id === preferredTabId);

  const activeTabId = activeTabExists
    ? preferredTabId
    : (currentSpaceTabs[0]?.id || (tabs[0]?.id || ''));

  // Ensure current space ALWAYS has at least one tab on startup or space switch (no black screens)
  useEffect(() => {
    if (tabs.length === 0) {
      const initialTab: Tab = {
        id: `tab-${Date.now()}`,
        title: 'Google',
        url: 'https://www.google.com',
        favicon: 'https://www.google.com/favicon.ico',
        pinned: false,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        spaceId: activeSpaceId || 'space-personal'
      };
      setTabs([initialTab]);
    } else {
      const spaceTabs = tabs.filter((t) => t.spaceId === activeSpaceId);
      if (spaceTabs.length === 0) {
        const spaceTab: Tab = {
          id: `tab-${Date.now()}`,
          title: 'Google',
          url: 'https://www.google.com',
          favicon: 'https://www.google.com/favicon.ico',
          pinned: false,
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          spaceId: activeSpaceId
        };
        setTabs((prev) => [...prev, spaceTab]);
      }
    }
  }, [tabs.length, activeSpaceId]);

  // Auto-collapse workflow canvas whenever triggering other views or surfaces (Assistant remains open alongside Workflow Studio for live vibe coding)
  useEffect(() => {
    if (workflowCanvasOpen) {
      if (
        commandBarOpen ||
        splitPickerOpen ||
        vaultOpen ||
        sidebarHovered ||
        historyOpen ||
        downloadsOpen ||
        settingsOpen ||
        aboutOpen
      ) {
        setWorkflowCanvasOpen(false);
        setBottomHovered(false);
      }
    }
  }, [
    commandBarOpen,
    splitPickerOpen,
    vaultOpen,
    sidebarHovered,
    historyOpen,
    downloadsOpen,
    settingsOpen,
    aboutOpen,
    workflowCanvasOpen
  ]);

  // Workflow canvas remains open during tab creation and workflow executions.
  // Closed strictly via user intent (Escape key, toggle pill, or close button).

  const webviewsRef = useRef<Record<string, any>>({});

  // Debounced persistence to eliminate main thread synchronous I/O blocking
  useEffect(() => {
    if (isPrivate) return;
    const timer = setTimeout(() => {
      localStorage.setItem('arco_spaces', JSON.stringify(spaces));
    }, 400);
    return () => clearTimeout(timer);
  }, [spaces, isPrivate]);

  useEffect(() => {
    if (isPrivate) return;
    const timer = setTimeout(() => {
      localStorage.setItem('arco_tabs', JSON.stringify(tabs));
    }, 400);
    return () => clearTimeout(timer);
  }, [tabs, isPrivate]);

  useEffect(() => {
    if (isPrivate) return;
    const timer = setTimeout(() => {
      localStorage.setItem('arco_history', JSON.stringify(history));
    }, 500);
    return () => clearTimeout(timer);
  }, [history, isPrivate]);

  useEffect(() => {
    if (isPrivate) return;
    const timer = setTimeout(() => {
      localStorage.setItem('arco_active_space', activeSpaceId);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeSpaceId, isPrivate]);

  useEffect(() => {
    if (isPrivate) return;
    const timer = setTimeout(() => {
      localStorage.setItem('lor_split_orders', JSON.stringify(splitOrderMap));
    }, 400);
    return () => clearTimeout(timer);
  }, [splitOrderMap, isPrivate]);

  useEffect(() => {
    if (isPrivate) return;
    localStorage.setItem('arco_sidebar_pinned', String(sidebarPinnedOpen));
  }, [sidebarPinnedOpen, isPrivate]);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeTabPartner = activeTab?.splitWithTabId
    ? tabs.find((t) => t.id === activeTab.splitWithTabId && t.spaceId === activeSpaceId)
    : null;

  // Split is active IF AND ONLY IF the currently selected tab is grouped in a split pair!
  const isSplitActive = Boolean(activeTab && activeTabPartner);

  const currentOrder = activeTab ? splitOrderMap[activeTab.id] : null;
  const splitLeftTabId = isSplitActive
    ? (currentOrder && (currentOrder.leftTabId === activeTab?.id || currentOrder.leftTabId === activeTabPartner?.id)
        ? currentOrder.leftTabId
        : activeTab!.id)
    : null;

  const splitRightTabId = isSplitActive
    ? (splitLeftTabId === activeTab?.id ? activeTabPartner!.id : activeTab!.id)
    : null;

  // ==========================================
  // Arc-Style Picture-in-Picture & Mini Player
  // ==========================================
  const activeMediaTabIdRef = useRef<string | null>(null);
  const currentMediaInfoRef = useRef<any>(null);
  const isPiPOpenRef = useRef<boolean>(false);

  // Event-driven media playback state handler
  const handleMediaStateChange = (tabId: string, media: any) => {
    if (media && media.isPlaying) {
      activeMediaTabIdRef.current = tabId;
      currentMediaInfoRef.current = media;
      // @ts-ignore
      window.electronAPI?.pipUpdateMedia?.(media);

      // Auto-trigger PiP if user is viewing a different tab
      if (tabId !== activeTabId && !isPiPOpenRef.current) {
        // @ts-ignore
        window.electronAPI?.pipOpen?.(media);
        isPiPOpenRef.current = true;
      }
    } else {
      if (activeMediaTabIdRef.current === tabId) {
        if (currentMediaInfoRef.current) {
          currentMediaInfoRef.current.isPlaying = false;
        }
        // @ts-ignore
        window.electronAPI?.pipUpdateMedia?.({ ...currentMediaInfoRef.current, isPlaying: false });
      }
    }
  };

  // Auto-dock PiP when user returns to the tab playing media
  useEffect(() => {
    if (isPiPOpenRef.current && activeMediaTabIdRef.current === activeTabId) {
      // @ts-ignore
      window.electronAPI?.pipClose?.();
      isPiPOpenRef.current = false;
    }
  }, [activeTabId]);

  // Auto-trigger PiP when user leaves Lor Browser (window blur)
  useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI?.onWindowBlur) return;
    // @ts-ignore
    const cleanup = window.electronAPI.onWindowBlur(() => {
      const media = currentMediaInfoRef.current;
      const tId = activeMediaTabIdRef.current || activeTabId;
      if (media && media.isPlaying && tId && !isPiPOpenRef.current) {
        // @ts-ignore
        window.electronAPI.pipOpen(media);
        isPiPOpenRef.current = true;
      }
    });
    return cleanup;
  }, [activeTabId]);

  // Handle PiP transport controls (Play/Pause, Jump 15s, Seek)
  useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI?.onPiPControl) return;
    // @ts-ignore
    const cleanup = window.electronAPI.onPiPControl(({ action, payload }) => {
      const targetTabId = activeMediaTabIdRef.current || activeTabId;
      if (!targetTabId) return;
      const wv = webviewsRef.current[targetTabId];
      if (!wv || typeof wv.executeJavaScript !== 'function') return;

      if (action === 'togglePlay') {
        wv.executeJavaScript(`
          (function() {
            const v = document.querySelector('video') || document.querySelector('audio');
            if (v) { v.paused ? v.play() : v.pause(); }
          })()
        `).catch(() => {});
      } else if (action === 'jump') {
        wv.executeJavaScript(`
          (function(delta) {
            const v = document.querySelector('video') || document.querySelector('audio');
            if (v) { v.currentTime = Math.max(0, Math.min(v.duration || 100, v.currentTime + delta)); }
          })(${JSON.stringify(payload)})
        `).catch(() => {});
      } else if (action === 'seek' && payload) {
        wv.executeJavaScript(`
          (function(time) {
            const v = document.querySelector('video') || document.querySelector('audio');
            if (v) { v.currentTime = time; }
          })(${JSON.stringify(payload.time)})
        `).catch(() => {});
      }
    });
    return cleanup;
  }, [activeTabId]);

  // Handle "Back to Tab" from PiP window
  useEffect(() => {
    // @ts-ignore
    if (!window.electronAPI?.onSelectTabFromMain) return;
    // @ts-ignore
    const cleanup = window.electronAPI.onSelectTabFromMain((tabId: string) => {
      const targetTab = tabs.find((t) => t.id === tabId);
      if (targetTab) {
        if (targetTab.spaceId && targetTab.spaceId !== activeSpaceId) {
          handleSelectSpace(targetTab.spaceId);
        }
        handleSelectTab(targetTab.id);
      }
      isPiPOpenRef.current = false;
    });
    return cleanup;
  }, [tabs, activeSpaceId]);

  const recordHistory = (tab: Partial<Tab>) => {
    if (isPrivate) return;
    if (!tab.url || tab.url.startsWith('about:') || tab.url === 'about:blank') return;
    const sId = tab.spaceId || activeSpaceId;
    const space = spaces.find((s) => s.id === sId);

    setHistory((prev) => {
      if (prev.length > 0 && prev[0].url === tab.url && Date.now() - prev[0].timestamp < 3000) {
        return prev;
      }
      const newItem: HistoryItem = {
        id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: tab.title || tab.url || 'New Tab',
        url: tab.url || 'about:blank',
        favicon: tab.favicon,
        timestamp: Date.now(),
        spaceId: sId,
        spaceName: space?.name || 'Personal'
      };
      return [newItem, ...prev.slice(0, 499)];
    });
  };

  const handleOpenPrivateWindow = () => {
    // @ts-ignore
    if (window.electronAPI?.openPrivateWindow) {
      // @ts-ignore
      window.electronAPI.openPrivateWindow();
    } else {
      window.open(window.location.origin + '?private=1', '_blank', 'width=1360,height=880');
    }
  };

  // Global Electron IPC shortcuts handler
  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI?.onShortcut) {
      // @ts-ignore
      const cleanup = window.electronAPI.onShortcut((shortcut: string) => {
        if (shortcut === 'new-tab') {
          setCommandBarMode('new-tab');
          setCommandBarOpen(true);
        } else if (shortcut === 'focus-address-bar') {
          setCommandBarMode('edit-url');
          setCommandBarOpen(true);
        } else if (shortcut === 'close-tab') {
          if (activeTabId) handleCloseTab(activeTabId);
        } else if (shortcut === 'toggle-sidebar') {
          handleTogglePinSidebar();
        } else if (shortcut === 'split-screen') {
          setSplitPickerOpen((prev) => !prev);
        } else if (shortcut === 'open-history') {
          if (!isPrivate) {
            setHistoryOpen((prev) => !prev);
          }
        } else if (shortcut === 'open-vault') {
          if (!isPrivate) {
            setVaultOpen((prev) => !prev);
          }
        } else if (shortcut === 'toggle-assistant') {
          setAssistantOpen((prev) => !prev);
        } else if (shortcut === 'quick-chat') {
          handleOpenQuickChat();
        } else if (shortcut === 'open-downloads') {
          setDownloadsOpen((prev) => !prev);
        } else if (shortcut === 'open-about') {
          setSettingsTab('about');
          setSettingsOpen(true);
        } else if (shortcut === 'open-settings') {
          setSettingsTab('appearance');
          setSettingsOpen(true);
        } else if (shortcut === 'open-settings-history') {
          setSettingsTab('history');
          setSettingsOpen(true);
        } else if (shortcut === 'open-settings-shortcuts') {
          setSettingsTab('shortcuts');
          setSettingsOpen(true);
        } else if (shortcut === 'navigate-back') {
          handleGoBack();
        } else if (shortcut === 'navigate-forward') {
          handleGoForward();
        }
      });
      return cleanup;
    }
  }, [activeTabId, activeSpaceId, spaces]);

  // Window keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (splitPickerOpen) {
          e.preventDefault();
          setSplitPickerOpen(false);
          return;
        }
        if (vaultOpen) {
          e.preventDefault();
          setVaultOpen(false);
          return;
        }
        if (assistantOpen) {
          e.preventDefault();
          setAssistantOpen(false);
          return;
        }
        if (commandBarOpen) {
          e.preventDefault();
          setCommandBarOpen(false);
          return;
        }
        if (settingsOpen) {
          e.preventDefault();
          setSettingsOpen(false);
          return;
        }
        if (historyOpen) {
          e.preventDefault();
          setHistoryOpen(false);
          return;
        }
        if (downloadsOpen) {
          e.preventDefault();
          setDownloadsOpen(false);
          return;
        }
        if (aboutOpen) {
          e.preventDefault();
          setAboutOpen(false);
          return;
        }
        if (onboardingOpen) {
          e.preventDefault();
          setOnboardingOpen(false);
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setAssistantOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenQuickChat();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (!isPrivate) {
          setVaultOpen((prev) => !prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleTogglePinSidebar();
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsTab('appearance');
        setSettingsOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenPrivateWindow();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setCommandBarMode('new-tab');
        setCommandBarOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setCommandBarMode('edit-url');
        setCommandBarOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        // Control+S / Cmd+S: Split screen with current tab
        e.preventDefault();
        setSplitPickerOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'y' || e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        if (!isPrivate) {
          setHistoryOpen((prev) => !prev);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setDownloadsOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        if (e.altKey) {
          e.preventDefault();
          handleSwipeSpace(e.key === 'ArrowRight' ? 'right' : 'left');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, activeSpaceId, spaces, splitPickerOpen, commandBarOpen, historyOpen, downloadsOpen, aboutOpen, onboardingOpen]);

  // Spaces management - clean instant switch without post-switch sliding animation
  const handleSelectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    if (!spaceActiveTabMap[spaceId]) {
      const spaceTabs = tabs.filter((t) => t.spaceId === spaceId);
      if (spaceTabs.length > 0) {
        setSpaceActiveTabMap((prev) => ({ ...prev, [spaceId]: spaceTabs[0].id }));
      } else {
        handleCreateTab('https://www.google.com', false, spaceId);
      }
    }
  };

  // Advance strictly ONE space per swipe, wrapping around infinitely
  const handleSwipeSpace = (direction: 'left' | 'right') => {
    const currentIndex = spaces.findIndex((s) => s.id === activeSpaceId);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= spaces.length) targetIndex = 0;
    if (targetIndex < 0) targetIndex = spaces.length - 1;

    handleSelectSpace(spaces[targetIndex].id);
  };

  const handleAddSpace = () => {
    const name = prompt('New Space:', `Space ${spaces.length + 1}`);
    if (!name) return;
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name: name.trim(),
      themeColor: '#ffffff'
    };
    setSpaces((prev) => [...prev, newSpace]);
    handleSelectSpace(newSpace.id);
  };

  const handleRenameSpace = (spaceId: string, newName: string) => {
    if (!newName || !newName.trim()) return;

    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, name: newName.trim() } : s))
    );
  };

  const handleDeleteSpace = (spaceId: string) => {
    if (spaces.length <= 1) return;
    const remaining = spaces.filter((s) => s.id !== spaceId);
    setSpaces(remaining);
    setTabs((prev) => prev.filter((t) => t.spaceId !== spaceId));
    if (activeSpaceId === spaceId) {
      handleSelectSpace(remaining[0].id);
    }
  };

  // Tab operations
  const handleSelectTab = (tabId: string) => {
    // If the currently active tab is unawakened/frozen and the user chooses to switch away, Lor closes it
    const currentTab = tabs.find((t) => t.id === activeTabId);
    if (currentTab && currentTab.isFrozen && currentTab.id !== tabId) {
      handleCloseTab(currentTab.id);
    }

    setSpaceActiveTabMap((prev) => ({
      ...prev,
      [activeSpaceId]: tabId
    }));
  };

  const handleArchiveAndFreezeTab = async (tabId: string) => {
    if (isPrivate) return;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || tab.pinned || tab.id === activeTabId) return;

    let contentSnippet = '';
    const wv = webviewsRef.current[tabId];
    if (wv && typeof wv.executeJavaScript === 'function') {
      try {
        contentSnippet = await wv.executeJavaScript('document.body ? document.body.innerText.slice(0, 3000) : ""');
      } catch {}
    }

    // @ts-ignore
    if (window.electronAPI?.vaultArchiveTab) {
      const space = spaces.find((s) => s.id === tab.spaceId);
      // @ts-ignore
      window.electronAPI.vaultArchiveTab({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favicon: tab.favicon,
        contentSnippet,
        spaceName: space?.name || 'Personal',
        isPinned: tab.pinned
      });
    }

    handleUpdateTab(tabId, { isFrozen: true });
    delete webviewsRef.current[tabId];
  };

  const handleVaultInactiveTabs = async () => {
    if (isPrivate) return;
    const toVault = tabs.filter(
      (t) => !t.pinned && t.id !== activeTabId && t.spaceId === activeSpaceId
    );

    for (const tab of toVault) {
      let contentSnippet = '';
      const wv = webviewsRef.current[tab.id];
      if (wv && typeof wv.executeJavaScript === 'function') {
        try {
          contentSnippet = await wv.executeJavaScript('document.body ? document.body.innerText.slice(0, 3000) : ""');
        } catch {}
      }

      // @ts-ignore
      if (window.electronAPI?.vaultArchiveTab) {
        const space = spaces.find((s) => s.id === tab.spaceId);
        // @ts-ignore
        window.electronAPI.vaultArchiveTab({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon,
          contentSnippet,
          spaceName: space?.name || 'Personal',
          isPinned: tab.pinned
        });
      }
      delete webviewsRef.current[tab.id];
    }

    setTabs((prev) => prev.filter((t) => t.pinned || t.id === activeTabId || t.spaceId !== activeSpaceId));
  };

  const handleRestoreVaultTab = (vaultItem: VaultTabItem) => {
    const existing = tabs.find((t) => t.url === vaultItem.url && t.spaceId === activeSpaceId);
    if (existing) {
      handleSelectTab(existing.id);
      if (existing.isFrozen) {
        handleUpdateTab(existing.id, { isFrozen: false, lastActiveAt: Date.now() });
      }
      return;
    }

    const newTab: Tab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: vaultItem.title,
      url: vaultItem.url,
      favicon: vaultItem.favicon,
      pinned: false,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      spaceId: activeSpaceId,
      isFrozen: false,
      lastActiveAt: Date.now()
    };

    setTabs((prev) => [...prev, newTab]);
    setSpaceActiveTabMap((prev) => ({
      ...prev,
      [activeSpaceId]: newTab.id
    }));
  };

  // Lor does NOT put tabs to sleep when the browser is open. All tabs stay active and responsive.

  const handleCreateTab = (url: string = 'https://www.google.com', pinned: boolean = false, spaceId = activeSpaceId): string => {
    const safeUrl = typeof url === 'string' && url.trim() ? url.trim() : 'https://www.google.com';
    const isGoogle = safeUrl.includes('google.com');
    const isDocs = safeUrl.includes('docs.google.com');
    let title = isGoogle ? 'Google' : 'New Tab';
    let favicon = isGoogle ? 'https://www.google.com/favicon.ico' : undefined;

    if (isDocs) {
      title = safeUrl.includes('/document/d/') ? 'Google Document' : 'Google Docs';
      favicon = 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico';
    }

    const effectiveSpaceId = spaceId || activeSpaceId;
    const newTab: Tab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      url: safeUrl,
      favicon,
      pinned,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      spaceId: effectiveSpaceId
    };

    setTabs((prev) => [...prev, newTab]);
    setSpaceActiveTabMap((prev) => ({
      ...prev,
      [effectiveSpaceId]: newTab.id
    }));
    recordHistory(newTab);
    return newTab.id;
  };

  const handleCreateSplitTab = (url: string = 'https://www.google.com') => {
    const isGoogle = url.includes('google.com');
    const newTab: Tab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: isGoogle ? 'Google' : 'New Tab',
      url,
      favicon: isGoogle ? 'https://www.google.com/favicon.ico' : undefined,
      pinned: false,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      spaceId: activeSpaceId
    };

    setTabs((prev) => [...prev, newTab]);
    handleSplitTabWith(newTab.id, activeTabId);
    recordHistory(newTab);
  };

  const handleUnsplitTab = (tabId?: string) => {
    const targetId = tabId || activeTabId;
    setTabs((prev) => {
      const target = prev.find((t) => t.id === targetId);
      const partnerId = target?.splitWithTabId || (activeTab?.id === targetId ? activeTabPartner?.id : undefined);
      return prev.map((t) => {
        if (t.id === targetId || (partnerId && t.id === partnerId)) {
          return { ...t, splitWithTabId: undefined };
        }
        return t;
      });
    });
  };

  const handleCloseSplit = () => {
    const targetTab = tabs.find((t) => t.id === activeTabId);
    const partnerId = targetTab?.splitWithTabId;
    const partner = partnerId ? tabs.find((t) => t.id === partnerId) : null;
    if (partner?.isAgentSearchTab) {
      handleCloseTab(partner.id);
    } else if (targetTab?.isAgentSearchTab) {
      handleCloseTab(targetTab.id);
    } else {
      handleUnsplitTab();
    }
  };

  const handleAgentSplitSearch = (url: string) => {
    const currentTabId = activeTabId;
    if (!currentTabId) {
      handleCreateTab(url);
      return;
    }

    const currentTab = tabs.find((t) => t.id === currentTabId);
    const existingPartnerId = currentTab?.splitWithTabId;
    const existingPartner = existingPartnerId ? tabs.find((t) => t.id === existingPartnerId) : null;

    if (existingPartner && existingPartner.isAgentSearchTab) {
      handleNavigate(url, existingPartner.id);
      return;
    }

    const agentTabId = `tab-agent-search-${Date.now()}`;
    const agentTab: Tab = {
      id: agentTabId,
      title: 'Lor Research',
      url,
      spaceId: activeSpaceId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      pinned: false,
      isAgentSearchTab: true,
      isLoading: true,
      canGoBack: false,
      canGoForward: false
    };

    setTabs((prev) => [...prev, agentTab]);

    // Split screen: user's current screen goes left, machine screen goes right
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === currentTabId) return { ...t, splitWithTabId: agentTabId };
        if (t.id === agentTabId) return { ...t, splitWithTabId: currentTabId };
        if (t.splitWithTabId === currentTabId) return { ...t, splitWithTabId: undefined };
        return t;
      })
    );

    setSplitOrderMap((prev) => ({
      ...prev,
      [currentTabId]: { leftTabId: currentTabId, rightTabId: agentTabId },
      [agentTabId]: { leftTabId: currentTabId, rightTabId: agentTabId }
    }));

    // Keep user's active tab on the left (user-controlled screen)
    setSpaceActiveTabMap((prev) => ({ ...prev, [activeSpaceId]: currentTabId }));
  };

  const handleCloseTab = (tabId: string) => {
    const tabToClose = tabs.find((t) => t.id === tabId);
    if (tabToClose) {
      recordHistory(tabToClose);
    }

    // If closing one side of a split, un-split or close agent partner
    if (tabToClose?.splitWithTabId) {
      const partnerId = tabToClose.splitWithTabId;
      const partnerTab = tabs.find((t) => t.id === partnerId);

      // If user closes their tab, also close the machine-controlled partner tab automatically!
      if (partnerTab?.isAgentSearchTab) {
        setTabs((prev) =>
          prev.filter((t) => t.id !== tabId && t.id !== partnerId)
        );
        delete webviewsRef.current[partnerId];
      } else {
        setTabs((prev) =>
          prev
            .map((t) => (t.id === partnerId ? { ...t, splitWithTabId: undefined } : t))
            .filter((t) => t.id !== tabId)
        );
      }
      if (activeTabId === tabId && partnerId && !partnerTab?.isAgentSearchTab) {
        setSpaceActiveTabMap((prev) => ({ ...prev, [activeSpaceId]: partnerId }));
      }
      delete webviewsRef.current[tabId];
      return;
    }

    const remainingInSpace = tabs.filter((t) => t.spaceId === activeSpaceId && t.id !== tabId);
    if (tabId === activeTabId) {
      if (remainingInSpace.length > 0) {
        setSpaceActiveTabMap((prev) => ({
          ...prev,
          [activeSpaceId]: remainingInSpace[remainingInSpace.length - 1].id
        }));
      } else {
        const freshTab: Tab = {
          id: `tab-${Date.now()}`,
          title: 'Google',
          url: 'https://www.google.com',
          pinned: false,
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          spaceId: activeSpaceId
        };
        setTabs((prev) => [...prev.filter((t) => t.id !== tabId), freshTab]);
        setSpaceActiveTabMap((prev) => ({
          ...prev,
          [activeSpaceId]: freshTab.id
        }));
        delete webviewsRef.current[tabId];
        return;
      }
    }
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    delete webviewsRef.current[tabId];
  };

  const handleTogglePinTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, pinned: !t.pinned } : t))
    );
  };

  const handleMoveTabToPinned = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, pinned: true } : t))
    );
  };

  const handleMoveTabToUnpinned = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, pinned: false } : t))
    );
  };

  const handleDropTabOnSpace = (tabId: string, spaceId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, spaceId } : t))
    );
    handleSelectSpace(spaceId);
    setSpaceActiveTabMap((prev) => ({ ...prev, [spaceId]: tabId }));
  };

  const handleUpdateTab = (tabId: string, updates: Partial<Tab>) => {
    setTabs((prev) => {
      const next = prev.map((t) => (t.id === tabId ? { ...t, ...updates } : t));
      const updatedTab = next.find((t) => t.id === tabId);
      if (updatedTab && (updates.url || (updates.title && updates.title !== 'New Tab' && updates.title !== 'Google'))) {
        recordHistory(updatedTab);
      }
      return next;
    });
  };

  const handleClearTabs = () => {
    const unpinnedToArchive = tabs.filter((t) => t.spaceId === activeSpaceId && !t.pinned);
    unpinnedToArchive.forEach((t) => recordHistory(t));

    setTabs((prev) => prev.filter((t) => t.spaceId !== activeSpaceId || t.pinned));
    const remaining = tabs.filter((t) => t.spaceId === activeSpaceId);
    if (remaining.length > 0) {
      setSpaceActiveTabMap((prev) => ({
        ...prev,
        [activeSpaceId]: remaining[0].id
      }));
    } else {
      handleCreateTab('https://www.google.com', false);
    }
  };

  // Horizontal Split Screen: pair two tabs together
  const handleSplitTabWith = (firstTabId: string, secondTabId?: string) => {
    const leftId = secondTabId || activeTabId;
    const rightId = firstTabId;
    if (!leftId || !rightId) return;

    // If same tab, separate / unsplit the pair
    if (leftId === rightId) {
      handleUnsplitTab(leftId);
      return;
    }

    // Link both tabs together
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === leftId) {
          return { ...t, splitWithTabId: rightId };
        }
        if (t.id === rightId) {
          return { ...t, splitWithTabId: leftId };
        }
        if (t.splitWithTabId === leftId || t.splitWithTabId === rightId) {
          return { ...t, splitWithTabId: undefined };
        }
        return t;
      })
    );

    // Stably record left & right positions
    setSplitOrderMap((prev) => ({
      ...prev,
      [leftId]: { leftTabId: leftId, rightTabId: rightId },
      [rightId]: { leftTabId: leftId, rightTabId: rightId }
    }));

    setSpaceActiveTabMap((prev) => ({
      ...prev,
      [activeSpaceId]: leftId
    }));
  };

  // Navigation handlers
  const handleGoBack = () => {
    if (activeTabId && webviewsRef.current[activeTabId]?.goBack) {
      webviewsRef.current[activeTabId].goBack();
    }
  };

  const handleGoForward = () => {
    if (activeTabId && webviewsRef.current[activeTabId]?.goForward) {
      webviewsRef.current[activeTabId].goForward();
    }
  };

  const handleReload = () => {
    if (activeTabId && webviewsRef.current[activeTabId]?.reload) {
      webviewsRef.current[activeTabId].reload();
    }
  };

  const handleNavigate = (url: string) => {
    if (!activeTabId) {
      handleCreateTab(url, false);
    } else {
      const activeWv = webviewsRef.current[activeTabId];
      if (activeWv && activeWv.loadURL) {
        activeWv.loadURL(url);
      }
      handleUpdateTab(activeTabId, { url });
    }
  };

  const handleClearHistory = (spaceId?: string) => {
    if (spaceId) {
      setHistory((prev) => prev.filter((h) => h.spaceId !== spaceId));
    } else {
      setHistory([]);
    }
  };

  return (
    <div className={`arc-window ${isPrivate ? 'is-private-window' : ''}`}>
      {/* Global transparent drag overlay while resizing */}
      {isResizing && <div className="resizing-global-overlay" />}


      {/* While sidebar is peeking in auto-collapse mode, moving cursor or clicking into viewport dismisses it */}
      {!sidebarPinnedOpen && isSidebarOpen && (
        <div 
          className="sidebar-peek-dismiss-overlay"
          onClick={() => setSidebarHovered(false)}
          onMouseEnter={handleSidebarMouseLeave}
        />
      )}

      {/* Liquid Glass Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        isPinnedOpen={sidebarPinnedOpen}
        onTogglePin={handleTogglePinSidebar}
        sidebarWidth={sidebarWidth}
        isResizing={isResizing}
        onStartResize={handleStartResize}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        splitLeftTabId={splitLeftTabId}
        splitRightTabId={splitRightTabId}
        activeTab={activeTab}
        tabs={tabs}
        activeSpaceId={activeSpaceId}
        spaces={spaces}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onTogglePinTab={handleTogglePinTab}
        onMoveTabToPinned={handleMoveTabToPinned}
        onMoveTabToToday={handleMoveTabToUnpinned}
        onDropTabOnSpace={handleDropTabOnSpace}
        onNewTab={() => handleCreateTab('https://www.google.com')}
        onClearTabs={handleClearTabs}
        onSelectSpace={handleSelectSpace}
        onAddSpace={handleAddSpace}
        onRenameSpace={handleRenameSpace}
        onDeleteSpace={handleDeleteSpace}
        onNavigate={handleNavigate}
        onSwipeSpace={handleSwipeSpace}
        isPrivate={isPrivate}
        onOpenArchive={() => {
          if (!isPrivate) {
            setHistoryOpen((prev) => !prev);
          }
        }}
        onOpenVault={() => {
          if (!isPrivate) {
            setVaultOpen((prev) => !prev);
          }
        }}
        onOpenDownloads={() => setDownloadsOpen((prev) => !prev)}
        onOpenAbout={() => {
          setSettingsTab('about');
          setSettingsOpen(true);
        }}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || 'appearance');
          setSettingsOpen(true);
        }}
        downloads={downloads}
        downloadsCount={downloads.length}
        activeDownloadsCount={downloads.filter((d) => d.state === 'progressing').length}
        onOpenSplitPicker={() => setSplitPickerOpen(true)}
        onSplitTabWith={handleSplitTabWith}
        onUnsplitTab={handleUnsplitTab}
      />

      {/* Monochrome Viewport Card */}
      <main 
        className="arc-viewport-card"
        onMouseEnter={() => {
          if (!sidebarPinnedOpen) {
            handleSidebarMouseLeave();
          }
        }}
        onMouseDown={(e) => {
          if (!sidebarPinnedOpen && sidebarHovered) {
            setSidebarHovered(false);
          }
          // Long-press with left mouse button (500ms) triggers screen snip
          if (e.button === 0) {
            longPressTimerRef.current = setTimeout(() => {
              setSnipTrigger((prev) => prev + 1);
            }, 500);
          }
        }}
        onMouseUp={() => {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }}
        onMouseLeave={() => {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }}
      >
        {isPrivate && (
          <div className="private-mode-badge" title="Incognito Window: No browsing history is recorded">
            <Shield size={12} />
            <span>Private Window</span>
          </div>
        )}

        <WebViewContainer
          tabs={tabs}
          activeTabId={activeTabId}
          isPrivate={isPrivate}
          onEdgeHover={handleSidebarMouseEnter}
          isSidebarOpen={isSidebarOpen}
          isSplitActive={isSplitActive}
          splitLeftTabId={splitLeftTabId}
          splitRightTabId={splitRightTabId}
          onCloseSplit={handleCloseSplit}
          onDropToSplit={handleSplitTabWith}
          onOpenSplitPicker={() => setSplitPickerOpen(true)}
          onOpenNewTab={(url) => handleCreateTab(url, false)}
          onUpdateTab={handleUpdateTab}
          onCloseTab={handleCloseTab}
          registerWebviewRef={(tabId, el) => {
            webviewsRef.current[tabId] = el;
          }}
          onMediaStateChange={handleMediaStateChange}
        />
      </main>

      {/* Choose Tab to Split With Modal */}
      <SplitTabPicker
        isOpen={splitPickerOpen}
        tabs={tabs}
        activeTabId={activeTabId}
        activeSpaceId={activeSpaceId}
        onClose={() => setSplitPickerOpen(false)}
        onSelectTabToSplit={(tabId) => {
          handleSplitTabWith(tabId);
          setSplitPickerOpen(false);
        }}
        onNewTabSplit={() => {
          handleCreateSplitTab('https://www.google.com');
          setSplitPickerOpen(false);
        }}
      />

      {/* History Archive Modal (Shows history per space by default) */}
      <HistoryArchive
        isOpen={historyOpen}
        history={history}
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        onClose={() => setHistoryOpen(false)}
        onOpenItem={(url) => {
          handleCreateTab(url, false, activeSpaceId);
          setHistoryOpen(false);
        }}
        onClearHistory={handleClearHistory}
        onRemoveItem={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
      />

      {/* Downloads Manager Modal */}
      <DownloadsManager
        isOpen={downloadsOpen}
        downloads={downloads}
        onClose={() => setDownloadsOpen(false)}
        onClearDownloads={() => setDownloads([])}
        onRemoveItem={(id) => setDownloads((prev) => prev.filter((d) => d.id !== id))}
      />

      {/* On-Device SQLite & Apple Neural Engine Tab Vault */}
      <TabVaultModal
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
        onRestoreTab={handleRestoreVaultTab}
        onVaultAllInactiveTabs={handleVaultInactiveTabs}
        inactiveTabsCount={tabs.filter((t) => !t.pinned && t.id !== activeTabId && t.spaceId === activeSpaceId).length}
      />

      {/* Settings & Preferences Modal (Appearance, History, Shortcuts, About) */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
        isPrivate={isPrivate}
        theme={theme}
        onThemeChange={(t) => setTheme(t)}
        searchEngine={searchEngine}
        onSearchEngineChange={(e) => {
          setSearchEngine(e);
          try { localStorage.setItem('lor_search_engine', e); } catch {}
        }}
        historyCount={history.length}
        onClearHistory={handleClearHistory}
        onOpenFullHistory={() => {
          setSettingsOpen(false);
          setHistoryOpen(true);
        }}
        onReplayOnboarding={() => {
          setSettingsOpen(false);
          setOnboardingOpen(true);
        }}
        lorAssistantEnabled={lorAssistantEnabled}
        onToggleLorAssistant={handleToggleLorAssistant}
      />

      {/* About Lor Modal (Tyler Tan Creator Spotlight) */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onReplayOnboarding={() => {
          setAboutOpen(false);
          setOnboardingOpen(true);
        }}
      />

      {/* Onboarding Lore Journey Modal */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onUpdateSpaces={(newSpaces) => {
          setSpaces(newSpaces);
          localStorage.setItem('arco_spaces', JSON.stringify(newSpaces));
          if (newSpaces.length > 0) {
            handleSelectSpace(newSpaces[0].id);
          }
        }}
        onOpenAbout={() => {
          setOnboardingOpen(false);
          setSettingsTab('about');
          setSettingsOpen(true);
        }}
      />

      {/* Centered Liquid Glass Searchbar */}
      <CommandBar
        isOpen={commandBarOpen}
        mode={commandBarMode}
        initialUrl={activeTab?.url || ''}
        history={history}
        tabs={tabs.filter((t) => t.spaceId === activeSpaceId)}
        isPrivate={isPrivate}
        onOpenVault={() => {
          if (!isPrivate) {
            setVaultOpen(true);
          }
        }}
        onClose={() => setCommandBarOpen(false)}
        onSelectTab={(tabId) => {
          handleSelectTab(tabId);
          setCommandBarOpen(false);
        }}
        onSubmit={(url, isNewTab) => {
          if (isNewTab) {
            handleCreateTab(url);
          } else {
            handleNavigate(url);
          }
        }}
      />

      {/* Omnipotent On-Screen Assistant (The Living Celestial Orb & Glass HUD) */}
      {lorAssistantEnabled && (
        <LorCoreAssistant
          isOpen={assistantOpen}
          onToggle={() => setAssistantOpen((prev) => !prev)}
          activeTab={activeTab}
          tabs={tabs}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          isPrivate={isPrivate}
          onSplitScreen={() => setSplitPickerOpen(true)}
          onVaultInactiveTabs={handleVaultInactiveTabs}
          onToggleSidebar={handleTogglePinSidebar}
          onSelectSpace={handleSelectSpace}
          onNewTab={(url) => handleCreateTab(url)}
          onAgentSplitSearch={handleAgentSplitSearch}
          quickChatTrigger={quickChatTrigger}
          snipTrigger={snipTrigger}
          onOpenVault={() => setVaultOpen(true)}
          onOpenWorkflowCanvas={handleOpenWorkflowCanvas}
          webviewsRef={webviewsRef}
        />
      )}

      {/* Bottom Screen Liquid Glass Workflow Trigger - Proper Crescent Lunar Dome */}
      <div className={`lor-bottom-workflow-trigger-zone ${bottomHovered || isHalfMoonCharging ? 'active' : ''}`}>
        <div 
          className={`lor-half-moon-trigger ${bottomHovered || isHalfMoonCharging ? 'popped-up' : ''} ${isHalfMoonCharging ? 'charging' : ''}`}
          onMouseEnter={handleHalfMoonMouseEnter}
          onMouseLeave={handleHalfMoonMouseLeave}
          onClick={handleHalfMoonClick}
          title="LorFlow (Dwell cursor to charge and launch)"
        >
          {/* Proper Crescent SVG: 100% Opaque Solid Silhouette + Circumference Beam */}
          <svg className="lor-half-moon-circumference-svg" viewBox="0 0 300 48">
            <defs>
              <linearGradient id="lor-crescent-solid-bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14141a" />
                <stop offset="55%" stopColor="#0a0a0d" />
                <stop offset="100%" stopColor="#020203" />
              </linearGradient>
            </defs>
            {/* 100% Solid Opaque Crescent Silhouette (Zero bleed-through) */}
            <path
              d="M 12,44 A 140,42 0 0,1 288,44 Q 150,50 12,44 Z"
              fill="url(#lor-crescent-solid-bg)"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeWidth="1.2"
              strokeLinejoin="round"
              className="lor-crescent-body"
            />
            {/* Perimeter Track */}
            <path
              d="M 12,44 A 140,42 0 0,1 288,44"
              fill="none"
              strokeLinecap="round"
              className="lor-half-moon-track"
            />
            {/* Circumference Charging Beam */}
            <path
              d="M 12,44 A 140,42 0 0,1 288,44"
              fill="none"
              strokeLinecap="round"
              pathLength="100"
              className="lor-half-moon-beam"
            />
          </svg>

          {/* Clean High-Contrast Readable Single-Line Content */}
          <div className="lor-half-moon-content">
            <Layers size={13} className="lor-half-moon-icon" />
            <span className="lor-half-moon-text">LorFlow</span>
            <span className="lor-half-moon-badge">{isHalfMoonCharging ? 'Charging...' : 'Autonomous Agents'}</span>
            <ChevronUp size={11} className="lor-half-moon-chevron" />
          </div>
        </div>
      </div>

      {/* Liquid Glass Thought Process & Human-in-the-Loop Workflow Canvas */}
      <LiquidGlassWorkflowOverlay
        isOpen={workflowCanvasOpen}
        onClose={handleCloseWorkflowCanvas}
        onOpenGoogleDoc={(url) => handleCreateTab(url, false, activeSpaceId)}
        tabs={tabs}
        activeTabId={activeTabId}
        activeSpaceId={activeSpaceId}
        webviewsRef={webviewsRef}
        onSelectTab={handleSelectTab}
        onToggleAssistant={() => setAssistantOpen((prev) => !prev)}
        isAssistantOpen={assistantOpen}
      />
    </div>
  );
};
