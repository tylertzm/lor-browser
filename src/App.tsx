import React, { useState, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { Tab, Space, HistoryItem, DownloadItem } from './types/browser';
import { Sidebar } from './components/Sidebar';
import { WebViewContainer } from './components/WebViewContainer';
import { HistoryArchive } from './components/HistoryArchive';
import { DownloadsManager } from './components/DownloadsManager';
import { CommandBar } from './components/CommandBar';
import { SplitTabPicker } from './components/SplitTabPicker';
import { AboutModal } from './components/AboutModal';
import { SettingsModal, SettingsTabId } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
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
  }
];

const cleanTabTitle = (title: string): string => {
  if (!title) return 'New Tab';
  return title
    .replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*/, '')
    .replace(/^[🟡🔴📐🥫🍕🛡️🤖🐙]\s*/, '')
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
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [sidebarPinnedOpen, setSidebarPinnedOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('arco_sidebar_pinned');
    return saved !== null ? saved === 'true' : true;
  });
  const isSidebarOpen = sidebarPinnedOpen || sidebarHovered;

  const handleTogglePinSidebar = () => {
    setSidebarPinnedOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSidebarHovered(false);
      }
      return next;
    });
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

  // Debounced auto-collapse
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
    }, 280);
  };

  const [spaceActiveTabMap, setSpaceActiveTabMap] = useState<Record<string, string>>({
    'space-personal': 'tab-google-default'
  });

  const activeTabId = spaceActiveTabMap[activeSpaceId] || (
    tabs.filter((t) => t.spaceId === activeSpaceId)[0]?.id || ''
  );

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
        } else if (shortcut === 'toggle-sidebar' || shortcut === 'split-screen') {
          setSplitPickerOpen((prev) => !prev);
        } else if (shortcut === 'open-history') {
          if (!isPrivate) {
            setHistoryOpen((prev) => !prev);
          }
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

      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
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
    setSpaceActiveTabMap((prev) => ({
      ...prev,
      [activeSpaceId]: tabId
    }));
  };

  const handleCreateTab = (url: string = 'https://www.google.com', pinned: boolean = false, spaceId = activeSpaceId) => {
    const isGoogle = url.includes('google.com');
    const newTab: Tab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: isGoogle ? 'Google' : 'New Tab',
      url,
      favicon: isGoogle ? 'https://www.google.com/favicon.ico' : undefined,
      pinned,
      isLoading: true,
      canGoBack: false,
      canGoForward: false,
      spaceId
    };

    setTabs((prev) => [...prev, newTab]);
    setSpaceActiveTabMap((prev) => ({
      ...prev,
      [spaceId]: newTab.id
    }));
    recordHistory(newTab);
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
    handleUnsplitTab();
  };

  const handleCloseTab = (tabId: string) => {
    const tabToClose = tabs.find((t) => t.id === tabId);
    if (tabToClose) {
      recordHistory(tabToClose);
    }

    // If closing one side of a split, un-split the partner
    if (tabToClose?.splitWithTabId) {
      const partnerId = tabToClose.splitWithTabId;
      setTabs((prev) =>
        prev
          .map((t) => (t.id === partnerId ? { ...t, splitWithTabId: undefined } : t))
          .filter((t) => t.id !== tabId)
      );
      if (activeTabId === tabId && partnerId) {
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

      {/* Screen Edge Hover Trigger Zone */}
      {!sidebarPinnedOpen && (
        <div 
          className="sidebar-hover-trigger"
          onMouseEnter={handleSidebarMouseEnter}
        />
      )}

      {/* Liquid Glass Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        isPinnedOpen={sidebarPinnedOpen}
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
            setSidebarHovered(false);
          }
        }}
        onMouseDown={() => {
          if (!sidebarPinnedOpen && sidebarHovered) {
            setSidebarHovered(false);
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
          isSidebarOpen={isSidebarOpen}
          isSplitActive={isSplitActive}
          splitLeftTabId={splitLeftTabId}
          splitRightTabId={splitRightTabId}
          onCloseSplit={handleCloseSplit}
          onDropToSplit={handleSplitTabWith}
          onOpenSplitPicker={() => setSplitPickerOpen(true)}
          onOpenNewTab={(url) => handleCreateTab(url, false)}
          onUpdateTab={handleUpdateTab}
          registerWebviewRef={(tabId, el) => {
            webviewsRef.current[tabId] = el;
          }}
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
    </div>
  );
};
