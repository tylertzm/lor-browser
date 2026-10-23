import React, { useState } from 'react';
import { Download, X, Trash2, Folder, ExternalLink, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DownloadItem } from '../types/browser';

interface DownloadsManagerProps {
  isOpen: boolean;
  downloads: DownloadItem[];
  onClose: () => void;
  onClearDownloads: () => void;
  onRemoveItem: (id: string) => void;
}

export const DownloadsManager: React.FC<DownloadsManagerProps> = ({
  isOpen,
  downloads,
  onClose,
  onClearDownloads,
  onRemoveItem
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = downloads.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.filename && item.filename.toLowerCase().includes(q)) ||
      (item.url && item.url.toLowerCase().includes(q))
    );
  });

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleShowInFolder = async (item: DownloadItem) => {
    if ((window as any).electronAPI?.showItemInFolder) {
      await (window as any).electronAPI.showItemInFolder(item.savePath);
    }
  };

  const handleOpenFile = async (item: DownloadItem) => {
    if ((window as any).electronAPI?.openPath) {
      await (window as any).electronAPI.openPath(item.savePath);
    }
  };

  const handleOpenDownloadsFolder = async () => {
    if ((window as any).electronAPI?.getDownloadsDir && (window as any).electronAPI?.openPath) {
      const dir = await (window as any).electronAPI.getDownloadsDir();
      if (dir) {
        await (window as any).electronAPI.openPath(dir);
      }
    }
  };

  return (
    <div className="history-modal-backdrop" onClick={onClose}>
      <div className="history-modal-box downloads-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="history-header">
          <div className="history-title-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} color="#ffffff" />
              <span className="history-heading">Downloads</span>
              {downloads.length > 0 && (
                <span className="downloads-count-badge">{downloads.length}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                className="history-action-btn"
                onClick={handleOpenDownloadsFolder}
                title="Open Downloads folder in Finder"
              >
                <Folder size={13} />
                <span>Open Folder</span>
              </button>

              {downloads.length > 0 && (
                <button 
                  className="history-action-btn" 
                  onClick={onClearDownloads}
                  title="Clear Download History"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}

              <button className="history-close-btn" onClick={onClose} title="Close">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="history-search-container" style={{ marginTop: 12 }}>
            <Search size={14} color="rgba(255, 255, 255, 0.4)" />
            <input
              type="text"
              className="history-search-input"
              placeholder="Filter downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button 
                className="history-search-clear" 
                onClick={() => setSearchQuery('')}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Downloads List */}
        <div 
          className="history-list downloads-list history-list-area"
          onWheel={(e) => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <div className="history-empty downloads-empty">
              <Download size={32} strokeWidth={1.5} color="rgba(255, 255, 255, 0.2)" />
              <p className="history-empty-text" style={{ marginTop: 12, color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, fontWeight: 500 }}>
                {searchQuery ? 'No matching downloads found' : 'No downloads yet'}
              </p>
              <span className="history-empty-sub" style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, 0.35)', marginTop: 4, display: 'block' }}>
                Files you download in Lor will be organized here
              </span>
            </div>
          ) : (
            filtered.map((item) => {
              const isProgressing = item.state === 'progressing';
              const isCompleted = item.state === 'completed';
              const isFailed = item.state === 'cancelled' || item.state === 'interrupted';
              const percent = item.totalBytes > 0 
                ? Math.min(100, Math.round((item.receivedBytes / item.totalBytes) * 100))
                : 0;

              return (
                <div key={item.id} className="history-item-row download-item-row">
                  <div className="download-item-icon-wrapper">
                    <FileText size={16} color="#ffffff" />
                  </div>

                  <div className="download-item-details" onClick={() => isCompleted && handleOpenFile(item)}>
                    <div className="download-item-title-row">
                      <span className="download-filename" title={item.savePath || item.filename}>
                        {item.filename}
                      </span>
                    </div>

                    <div className="download-item-meta">
                      {isProgressing && (
                        <span>
                          {formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)} ({percent}%)
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255, 255, 255, 0.6)' }}>
                          <CheckCircle2 size={12} color="#10b981" />
                          <span>{formatBytes(item.totalBytes || item.receivedBytes)}</span>
                        </span>
                      )}
                      {isFailed && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f87171' }}>
                          <AlertCircle size={12} />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </div>

                    {isProgressing && (
                      <div className="download-progress-bar-bg">
                        <div 
                          className="download-progress-bar-fill" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="download-item-actions">
                    {isCompleted && (
                      <>
                        <button
                          className="download-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(item);
                          }}
                          title="Open file"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          className="download-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowInFolder(item);
                          }}
                          title="Show in Finder"
                        >
                          <Folder size={13} />
                        </button>
                      </>
                    )}
                    <button
                      className="download-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      title="Remove from list"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
