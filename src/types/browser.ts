export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  pinned: boolean;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  spaceId: string;
  splitWithTabId?: string;
}

export interface Space {
  id: string;
  name: string;
  icon?: string;
  themeColor: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  timestamp: number;
  spaceId?: string;
  spaceName?: string;
  source?: 'lor' | 'chrome';
  visitCount?: number;
}

export interface DownloadItem {
  id: string;
  filename: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  savePath: string;
  url: string;
  mimeType?: string;
  startTime: number;
  completedTime?: number;
}
