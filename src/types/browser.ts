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
  isFrozen?: boolean;
  lastActiveAt?: number;
  isAgentSearchTab?: boolean;
}

export interface IndexedKnowledgeEntry {
  id: string;
  topic: string;
  category: string;
  summary: string;
  tags: string[];
  sourceUrl?: string;
  sourceTitle?: string;
  timestamp: number;
  filePath?: string;
}

export interface VaultTabItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  contentSnippet?: string;
  spaceName?: string;
  createdAt: number;
  lastAccessedAt: number;
  isPinned: boolean;
  score?: number;
}

export interface VaultStats {
  vaultedCount: number;
  dbSizeBytes: number;
  estimatedMbSaved: number;
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

export interface BackgroundWorkflowRequest {
  id: 'github-prs' | 'instagram-dms' | 'github-notifications' | 'custom';
  customUrl?: string;
  query?: string;
}

export interface BackgroundWorkflowResult {
  success: boolean;
  service?: string;
  loggedIn?: boolean;
  data?: any;
  error?: string;
}
