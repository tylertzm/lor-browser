import React, { useState, useEffect, useRef } from 'react';
import { Search, Archive, Trash2, ArrowUpRight, Cpu, HardDrive, Sparkles, X, Snowflake, CheckCircle2 } from 'lucide-react';
import { VaultTabItem, VaultStats } from '../types/browser';

interface TabVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreTab: (tab: VaultTabItem) => void;
  onVaultAllInactiveTabs?: () => void;
  inactiveTabsCount?: number;
}

export const TabVaultModal: React.FC<TabVaultModalProps> = ({
  isOpen,
  onClose,
  onRestoreTab,
  onVaultAllInactiveTabs,
  inactiveTabsCount = 0
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VaultTabItem[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    // @ts-ignore
    if (window.electronAPI?.vaultStats) {
      try {
        // @ts-ignore
        const s = await window.electronAPI.vaultStats();
        setStats(s);
      } catch (err) {
        console.error('Failed to fetch vault stats:', err);
      }
    }
  };

  const loadTabs = async (searchQuery: string) => {
    setLoading(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        if (!searchQuery.trim()) {
          // @ts-ignore
          const list = await window.electronAPI.vaultList(50);
          setResults(list || []);
        } else {
          // @ts-ignore
          const searchRes = await window.electronAPI.vaultSearch(searchQuery.trim(), 40);
          setResults(searchRes || []);
        }
      }
    } catch (err) {
      console.error('Vault query failed:', err);
    } finally {
      setLoading(false);
      setSelectedIndex(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      fetchStats();
      loadTabs('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadTabs(query);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  const handleDeleteTab = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // @ts-ignore
    if (window.electronAPI?.vaultDelete) {
      try {
        // @ts-ignore
        await window.electronAPI.vaultDelete(id);
        setResults((prev) => prev.filter((t) => t.id !== id));
        fetchStats();
        showNotice('Tab removed from vault');
      } catch (err) {
        console.error('Failed to delete tab:', err);
      }
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onRestoreTab(results[selectedIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const formatMbSaved = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="tab-vault-backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
      <div 
        className="tab-vault-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="tab-vault-header">
          <div className="tab-vault-title-group">
            <div className="tab-vault-icon-badge">
              <Archive size={18} />
            </div>
            <div>
              <div className="tab-vault-title">
                Tab Vault
                <span className="tab-vault-ai-pill" title="Hardware-accelerated semantic vector retrieval">
                  <Cpu size={12} />
                  Apple Neural Engine
                </span>
              </div>
              <div className="tab-vault-subtitle">
                Zero-bloat on-device memory. Inactive tabs are frozen to eliminate hoarding anxiety and free memory.
              </div>
            </div>
          </div>

          <button className="tab-vault-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Memory Metrics Banner */}
        <div className="tab-vault-stats-banner">
          <div className="tab-vault-stat-item">
            <HardDrive size={14} />
            <span><strong>{stats?.vaultedCount ?? results.length}</strong> Tabs in Vault</span>
          </div>
          <div className="tab-vault-stat-item highlight">
            <Snowflake size={14} />
            <span>Reclaimed Memory: <strong>~{formatMbSaved(stats?.estimatedMbSaved || (results.length * 220))}</strong></span>
          </div>

          {inactiveTabsCount > 0 && onVaultAllInactiveTabs && (
            <button 
              className="tab-vault-action-pill"
              onClick={() => {
                onVaultAllInactiveTabs();
                showNotice(`Vaulted ${inactiveTabsCount} inactive tabs`);
                setTimeout(() => {
                  fetchStats();
                  loadTabs(query);
                }, 400);
              }}
              title="Hibernate all inactive tabs into vault"
            >
              <Snowflake size={13} />
              Freeze & Vault {inactiveTabsCount} Inactive Tabs
            </button>
          )}
        </div>

        {/* Natural Language Omnisearch Input */}
        <div className="tab-vault-search-container">
          <Search size={16} className="tab-vault-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="tab-vault-search-input"
            placeholder="Search in natural language... (e.g. 'paper on language models', 'recipe', 'dashboard')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="tab-vault-search-clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Feedback notification toast */}
        {actionNotice && (
          <div className="tab-vault-notice">
            <CheckCircle2 size={14} />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tab List */}
        <div className="tab-vault-list">
          {loading && results.length === 0 ? (
            <div className="tab-vault-empty">
              <Sparkles size={24} className="spin-slow" />
              <p>Searching on-device memory...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="tab-vault-empty">
              <Archive size={28} />
              <p>{query ? 'No matching tabs found in vault.' : 'Your vault is currently empty.'}</p>
              <span>Tabs you freeze or archive will be indexed here with instant semantic retrieval.</span>
            </div>
          ) : (
            results.map((tab, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tab.id}
                  className={`tab-vault-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onRestoreTab(tab);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="tab-vault-card-main">
                    <div className="tab-vault-card-header">
                      {tab.favicon ? (
                        <img 
                          src={tab.favicon} 
                          alt="" 
                          className="tab-vault-favicon"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="tab-vault-favicon-fallback" />
                      )}

                      <span className="tab-vault-card-title">{tab.title || tab.url}</span>

                      {tab.spaceName && (
                        <span className="tab-vault-space-badge">{tab.spaceName}</span>
                      )}

                      <span className="tab-vault-card-time">
                        {formatRelativeTime(tab.lastAccessedAt || tab.createdAt)}
                      </span>
                    </div>

                    <div className="tab-vault-card-url">{tab.url}</div>

                    {tab.contentSnippet && (
                      <div className="tab-vault-card-snippet">
                        {tab.contentSnippet.slice(0, 160)}
                        {tab.contentSnippet.length > 160 ? '...' : ''}
                      </div>
                    )}
                  </div>

                  <div className="tab-vault-card-actions">
                    <button
                      className="tab-vault-card-btn restore-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreTab(tab);
                        onClose();
                      }}
                      title="Restore Tab"
                    >
                      <ArrowUpRight size={15} />
                      <span>Restore</span>
                    </button>

                    <button
                      className="tab-vault-card-btn delete-btn"
                      onClick={(e) => handleDeleteTab(e, tab.id)}
                      title="Delete from Vault"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="tab-vault-footer">
          <div className="tab-vault-footer-tips">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Restore Tab</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
          <div className="tab-vault-footer-privacy">
            <span>100% On-Device SQLite & ANE • Zero Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
