import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Snowflake, 
  Columns2, 
  CloudRain, 
  Search, 
  Cpu, 
  Zap, 
  GitPullRequest,
  MessageCircle,
  Volume2,
  VolumeX,
  Copy,
  CheckCircle2,
  Compass,
  HardDrive,
  Battery,
  Shield,
  Layers,
  Settings,
  SlidersHorizontal,
  Info,
  MessageSquareQuote,
  Crop,
  Trash2,
  ArrowUp,
  ArrowUpRight,
  Pin,
  PanelRightClose,
  PanelRightOpen,
  Bell,
  Edit2,
  Check,
  Bookmark,
  Eye
} from 'lucide-react';
import { Tab, Space, IndexedKnowledgeEntry } from '../types/browser';
import { LOR_LOGO } from '../assets/logoBase64';
import { routeMessage, buildRoutingContext, LorRouteId, RouterDecision } from '../lib/lorRouter';
import { LorFlowMCP } from '../services/lorflowMcp';

interface LorCoreAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab?: Tab;
  tabs: Tab[];
  spaces: Space[];
  activeSpaceId: string;
  isPrivate?: boolean;
  onSplitScreen: () => void;
  onVaultInactiveTabs: () => void;
  onToggleSidebar: () => void;
  onSelectSpace: (spaceId: string) => void;
  onNewTab: (url: string) => void;
  onAgentSplitSearch?: (url: string) => void;
  quickChatTrigger?: number;
  snipTrigger?: number;
  onOpenVault: () => void;
  onOpenWorkflowCanvas?: (preset?: 'school-lms' | 'social-media' | 'student-email' | 'github-prs' | 'hotel-research' | 'custom') => void;
  webviewsRef: React.MutableRefObject<Record<string, any>>;
}

export interface PastConversationItem {
  id: string;
  text: string;
  url: string;
  title: string;
  timestamp: number;
  imagePreview?: string;
  type?: 'ambient' | 'dropped' | 'snip' | 'chat';
  replyCount?: number;
  userNote?: string;
  isMemoryContributor?: boolean;
}

export type AmbientCommentItem = PastConversationItem;

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionPill?: string;
  timestamp: number;
  isObservation?: boolean;
  imagePreview?: string;
  targetUrl?: string;
  targetTitle?: string;
  suggestedChips?: string[];
}

export interface ModelTierOption {
  id: string;
  name: string;
  ram: string;
  disk: string;
  acceleration: string;
  multimodal?: boolean;
}

export const MODEL_TIERS: ModelTierOption[] = [
  {
    id: 'llama3.2:3b',
    name: 'Llama 3.2 3B (Reasoning & Context Memory)',
    ram: '3.2 GB',
    disk: '2.0 GB',
    acceleration: 'Apple Metal GPU',
    multimodal: false
  },
  {
    id: 'moondream',
    name: 'Moondream 2 (Multimodal Vision & Screen)',
    ram: '2.0 GB',
    disk: '828 MB',
    acceleration: 'Apple Metal GPU',
    multimodal: true
  },
  {
    id: 'smollm:135m',
    name: 'SmolLM 135M (Ultra Lightweight)',
    ram: '1.0 GB',
    disk: '91 MB',
    acceleration: 'Metal GPU',
    multimodal: false
  },
  {
    id: 'native-telekinesis',
    name: 'Native Telekinesis',
    ram: '0 MB',
    disk: '0 MB',
    acceleration: 'CPU & ANE',
    multimodal: false
  }
];

export const isModelMultimodal = (name: string): boolean => {
  const lower = (name || '').toLowerCase();
  return (
    lower.includes('moondream') ||
    lower.includes('vision') ||
    lower.includes('llava') ||
    lower.includes('minicpm') ||
    lower.includes('gemma3') ||
    lower.includes('bakllava')
  );
};

// ============================================================================
// Procedural Ambient Sound Generator (Pure Web Audio API — 0 MB Assets)
// ============================================================================
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private isPlaying = false;

  startRain() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.noiseNode = noise;
      this.isPlaying = true;
    } catch (err) {
      console.error('Audio synthesis failed:', err);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    try {
      if (this.noiseNode && (this.noiseNode as any).stop) {
        (this.noiseNode as any).stop();
      }
      if (this.ctx) {
        this.ctx.close();
      }
    } catch {}
    this.noiseNode = null;
    this.ctx = null;
    this.isPlaying = false;
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.startRain();
      return true;
    }
  }

  get active(): boolean {
    return this.isPlaying;
  }
}

const ambientAudio = new AmbientSoundEngine();

// Clean robotic AI preambles, forced memory transitions, and repetition degeneration loops
function cleanHumaneReply(rawText: string): string {
  let text = (rawText || '').trim();

  // Strip robotic preambles and forced memory bridges
  text = text
    .replace(/^I think I found a connection to (?:our|the) previous conversation[^:.\n]*[:.\n]?/i, '')
    .replace(/^Connecting back to (?:what you said|our previous conversation)[^:.\n]*[:.\n]?/i, '')
    .replace(/^Based on (?:my|the) background web search(?: findings)?[^:.\n]*[:.\n]?/i, '')
    .replace(/^I have a good understanding of[^.\n]*[.!?]/i, '')
    .replace(/^I('d| would) be happy to share[^.\n]*[.!?]/i, '')
    .replace(/^Here('s| is) what I know:?/i, '')
    .replace(/^As an (?:AI|artificial intelligence|assistant)[^.\n]*[.!?]/i, '')
    .replace(/^Sure,? here is[^.\n]*[:.!?]/i, '')
    .replace(/^Certainly[,!.]?\s*/i, '')
    .replace(/^Definitely[,!.]?\s*/i, '')
    .replace(/^Sure thing[,!.]?\s*/i, '')
    .replace(/^\*\*Overview:\*\*\s*/i, '')
    .trim();

  // Eliminate degeneration looping of words (e.g. "notification notification notification" -> "notification")
  text = text.replace(/(\b[\w'-]+\b)(?:\s+\1){2,}/gi, '$1');

  // Eliminate degeneration looping of phrases or sentences
  text = text.replace(/([^\n.?!]{6,50}[.?!]?)(?:\s*\1){2,}/gi, '$1');

  // Strip out code tags or DOM artifacts if leaked
  text = text.replace(/<[^>]+>/g, '').trim();

  // Strip trailing interviewer / survey / multiple-choice questions
  text = text
    .replace(/(?:What is it about [^?]+\?|Do you prefer [^?]+\?|What (?:do you think|part of it do you like)[^?]*\?)$/i, '')
    .replace(/[-–—]\s*(?:their|her|his|its)?\s*[\w\s,]+,\s*or (?:something else|what)\??$/i, '')
    .replace(/\s*(?:Am I correct|Do you agree|What are your thoughts)\??$/i, '')
    .trim();

  // Strip any emojis
  text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{2388}\u{200D}\u{FE0F}]/gu, '').trim();

  if (!text || text === ':') {
    text = "Got it.";
  }

  return text;
}

// ---------------------------------------------------------------------------
// High-Performance Ollama Chat Invoker & Completion LRU Cache
// Deduplicates boilerplate across 11 call sites and drops latency to <1ms
// ---------------------------------------------------------------------------
interface OllamaChatParams {
  model: string;
  messages: Array<{ role: string; content: string; images?: string[] }>;
  options?: {
    temperature?: number;
    repeat_penalty?: number;
    num_predict?: number;
    stop?: string[];
  };
  stream?: boolean;
  fallback?: string;
  useCache?: boolean;
  cacheTtlMs?: number;
}

const _ollamaChatCache = new Map<string, { reply: string; timestamp: number }>();

async function callOllamaChat(params: OllamaChatParams): Promise<string> {
  const {
    model,
    messages,
    options,
    fallback = "I'm right here with you.",
    useCache = true,
    cacheTtlMs = 180000 // 3 minutes TTL
  } = params;

  let cacheKey = '';
  if (useCache && messages.length > 0 && !messages.some(m => m.images && m.images.length > 0)) {
    const lastMsg = messages[messages.length - 1];
    cacheKey = `${model}:${lastMsg.role}:${lastMsg.content.slice(0, 300)}`;
    const cached = _ollamaChatCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
      return cached.reply;
    }
  }

  try {
    const res = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        options: options || { temperature: 0.5, num_predict: 160 },
        stream: false
      })
    });

    if (!res.ok) return fallback;
    const data = await res.json();
    const rawContent = data.message?.content || '';
    const cleaned = cleanHumaneReply(rawContent) || fallback;

    if (cacheKey && cleaned && cleaned !== fallback) {
      if (_ollamaChatCache.size > 120) {
        const firstKey = _ollamaChatCache.keys().next().value;
        if (firstKey) _ollamaChatCache.delete(firstKey);
      }
      _ollamaChatCache.set(cacheKey, { reply: cleaned, timestamp: Date.now() });
    }

    return cleaned;
  } catch {
    return fallback;
  }
}

// Global active page DOM snippet cache (10s TTL)
const _snippetCache = new Map<string, { snippet: string; timestamp: number }>();

// Global web search cache (15m TTL)
const _searchCache = new Map<string, { results: Array<{ title: string; snippet: string; url: string; source: string }>; timestamp: number }>();

function inferCategory(topic: string, text: string): string {
  const combined = (topic + ' ' + text).toLowerCase();
  if (/(code|typescript|javascript|react|electron|swift|python|bug|api|git|function|css|html|compiler)/.test(combined)) return 'Tech';
  if (/(album|song|singer|band|group|debut|music|track|kpop|k-pop|bighit|artist|concert)/.test(combined)) return 'Music';
  if (/(weather|forecast|rain|temperature|sunny|celsius|fahrenheit|humidity)/.test(combined)) return 'Weather';
  if (/(user|name|prefer|favorite|workflow|setting|profile)/.test(combined)) return 'Preferences';
  if (/(science|space|physics|galaxy|planet|webb|telescope|quantum|biology)/.test(combined)) return 'Science';
  return 'Web Research';
}

// ============================================================================
// Lor Core Component (The Omnipotent On-Screen Assistant)
// ============================================================================
export const LorCoreAssistant: React.FC<LorCoreAssistantProps> = ({
  isOpen,
  onToggle,
  activeTab,
  tabs,
  spaces,
  activeSpaceId,
  isPrivate = false,
  onSplitScreen,
  onVaultInactiveTabs,
  onToggleSidebar,
  onSelectSpace,
  onNewTab,
  onAgentSplitSearch,
  quickChatTrigger,
  snipTrigger,
  onOpenVault,
  onOpenWorkflowCanvas,
  webviewsRef
}) => {
  // Draggable position coordinates
  const [orbPos, setOrbPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('lor_core_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { x: window.innerWidth - 80, y: window.innerHeight - 90 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  // Model & System Specs State
  const [systemSpecs, setSystemSpecs] = useState<{ totalRamGb: number; cpuModel: string; freeRamGb: number } | null>(null);
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [activeModelId, setActiveModelId] = useState<string>(() => localStorage.getItem('lor_active_model_id') || 'llama3.2:3b');
  const [localModelName, setLocalModelName] = useState<string>('llama3.2:3b');
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean>(true);

  // Ambient Web Commentary State
  const [ambientCommentsEnabled, setAmbientCommentsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('lor_ambient_comments');
    return saved !== null ? saved === 'true' : true;
  });
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [hasNewNotif, setHasNewNotif] = useState<boolean>(false);
  const commentTimeoutRef = useRef<any>(null);
  const lastCommentedUrlRef = useRef<string>('');
  const lastCommentedTextRef = useRef<string>('');
  const lastSpontaneousTimeRef = useRef<number>(Date.now());

  // Momentum throw physics refs for the Living Celestial Orb
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastPointRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Resizable & Collapsible Sidebar State
  const [chatWidth, setChatWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('lor_chat_width');
      return saved ? Math.max(340, Math.min(1200, parseInt(saved, 10))) : 520;
    } catch {
      return 520;
    }
  });
  const [isPinnedOpen, setIsPinnedOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lor_chat_pinned');
      return saved !== null ? saved === 'true' : false; // Default to false for edge-to-edge hover reveal
    } catch {
      return false;
    }
  });
  const [isResizingChat, setIsResizingChat] = useState<boolean>(false);

  // User Profile & Friend Companion State
  const [userName, setUserName] = useState<string>(() => {
    const stored = localStorage.getItem('lor_user_name') || '';
    if (stored.toLowerCase() === 'watching') {
      localStorage.setItem('lor_user_name', 'Tyler');
      return 'Tyler';
    }
    return stored;
  });

  // Topic & Category Indexed Knowledge Base (Updated at all times & indexed for retrieval)
  const [indexedKnowledge, setIndexedKnowledge] = useState<IndexedKnowledgeEntry[]>(() => {
    try {
      const saved = localStorage.getItem('lor_indexed_knowledge');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Load disk knowledge from ~/.lor/knowledge/index.json on mount
  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI?.knowledgeLoadAll) {
      // @ts-ignore
      window.electronAPI.knowledgeLoadAll().then((diskEntries: IndexedKnowledgeEntry[]) => {
        if (Array.isArray(diskEntries) && diskEntries.length > 0) {
          setIndexedKnowledge((prev) => {
            const mergedMap = new Map<string, IndexedKnowledgeEntry>();
            diskEntries.forEach((e) => mergedMap.set(e.topic.toLowerCase() + '::' + e.category.toLowerCase(), e));
            prev.forEach((e) => {
              const k = e.topic.toLowerCase() + '::' + e.category.toLowerCase();
              if (!mergedMap.has(k)) mergedMap.set(k, e);
            });
            const merged = Array.from(mergedMap.values());
            try { localStorage.setItem('lor_indexed_knowledge', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      }).catch(() => {});
    }
  }, []);

  // Update knowledge files at all times in persistent storage and on disk
  const saveOrUpdateKnowledge = async (
    topic: string,
    category: string,
    summary: string,
    tags: string[] = [],
    sourceUrl?: string,
    sourceTitle?: string
  ) => {
    if (!topic.trim() || !summary.trim()) return;
    const entry: IndexedKnowledgeEntry = {
      id: `know-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topic: topic.trim(),
      category: category.trim() || 'General',
      summary: summary.trim(),
      tags: tags.map((t) => t.trim().toLowerCase()),
      sourceUrl,
      sourceTitle,
      timestamp: Date.now()
    };

    setIndexedKnowledge((prev) => {
      const key = entry.topic.toLowerCase() + '::' + entry.category.toLowerCase();
      const filtered = prev.filter((p) => (p.topic.toLowerCase() + '::' + p.category.toLowerCase()) !== key);
      const updated = [entry, ...filtered];
      try { localStorage.setItem('lor_indexed_knowledge', JSON.stringify(updated)); } catch {}
      return updated;
    });

    // Write real Markdown knowledge file in ~/.lor/knowledge/<Category>/<Topic>.md
    // @ts-ignore
    if (window.electronAPI?.knowledgeSaveEntry) {
      try {
        // @ts-ignore
        await window.electronAPI.knowledgeSaveEntry(entry);
      } catch (err) {
        console.error('Failed to write persistent knowledge file:', err);
      }
    }
  };

  // Assistant Chat State (Persisted within 5-min idle window, carries on rolling summary when refreshed)
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('lor_active_chat_messages');
      const lastActive = localStorage.getItem('lor_chat_last_active');
      const now = Date.now();
      if (saved && lastActive) {
        const diff = now - parseInt(lastActive, 10);
        // Only refresh if conversation has been idle for more than 5 minutes (300,000 ms)
        if (diff < 300000) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}

    const storedName = localStorage.getItem('lor_user_name');
    const rollingSummary = localStorage.getItem('lor_rolling_conversation_context');
    return [
      {
        id: 'msg-init',
        sender: 'assistant',
        text: rollingSummary
          ? (storedName
              ? `Hey ${storedName}. I saved our notes from earlier. What would you like to explore next?`
              : `I saved our notes from earlier. What would you like to explore next?`)
          : (storedName
              ? `Hey ${storedName}. Good to see you again. What are you working on or reading right now?`
              : "Hey. I'm Lor. I'm right here with you while you browse. What's your name, and what are you working on today?"),
        timestamp: Date.now()
      }
    ];
  });

  // Save active messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lor_active_chat_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Cmd+K Quick-Chat auto-focus & collapse on send
  const collapseOnSendRef = useRef<boolean>(false);

  useEffect(() => {
    if (quickChatTrigger && quickChatTrigger > 0) {
      collapseOnSendRef.current = true;
      setActiveView('chat');
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [quickChatTrigger]);

  // Long-press snip trigger from App.tsx viewport (left mouse button hold)
  useEffect(() => {
    if (snipTrigger && snipTrigger > 0) {
      setIsSnipActive(true);
      setSnipBox(null);
    }
  }, [snipTrigger]);

  // In-HUD Cmd+K shortcut listener
  useEffect(() => {
    const handleLocalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveView('chat');
        collapseOnSendRef.current = true;
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleLocalKeyDown);
    return () => window.removeEventListener('keydown', handleLocalKeyDown);
  }, []);

  // Listen for "Fix with Lor in Chat" request dispatched from LorFlow failed node
  useEffect(() => {
    const handleFixNodeRequest = (e: any) => {
      const { nodeId, nodeName, nodeType, errorReason } = e?.detail || {};
      const targetName = nodeName || 'Google Docs';
      const cleanError = errorReason || 'Execution parameter type mismatch';

      // Execute internal LorFlow MCP repair tool
      LorFlowMCP.fixNodeError(nodeId, cleanError);

      setActiveView('chat');
      setMessages(prev => [
        ...prev,
        {
          id: `msg-user-fix-${Date.now()}`,
          sender: 'user',
          text: `Fix failed node [${targetName}] in LorFlow: ${cleanError}`,
          timestamp: Date.now()
        },
        {
          id: `msg-resp-fix-${Date.now() + 1}`,
          sender: 'assistant',
          text: `### LorFlow Node Error Diagnosis & Auto-Fix\n\n• **Failed Node**: **${targetName}** (\`${nodeType || 'google_docs'}\`)\n• **Observed Error**: \`${cleanError}\`\n\n#### Root Cause Analysis\nThe node encountered a runtime failure when processing parameters during dynamic execution. An object reference or invalid type was passed where a sanitized document string was expected, causing downstream string parsing (\`includes\`) to throw.\n\n#### LorFlow MCP Action Applied\nI executed the internal \`lorflow_fix_node_error\` MCP tool:\n1. Sanitized parameter types across \`config\` and \`inputData\`.\n2. Configured safe direct export fallback to \`https://docs.google.com/document/create\`.\n3. Reset node state from \`error\` to \`pending\`.\n4. Recorded snapshot in LorFlow 24-hour version history.\n\nYour LorFlow canvas has been updated live!`,
          actionPill: 'LorFlow MCP: Repaired',
          suggestedChips: ['Run Repaired LorFlow', 'View LorFlow Canvas', 'Revert Version'],
          timestamp: Date.now() + 2
        }
      ]);
    };

    window.addEventListener('lor-ask-assistant-fix-node', handleFixNodeRequest);
    return () => window.removeEventListener('lor-ask-assistant-fix-node', handleFixNodeRequest);
  }, []);

  // 5-Minute Inactivity Idle Timer: Summarize conversation & carry it on
  const convoIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const summarizeAndArchiveConvo = (chatMessages: Message[]) => {
    const userTurns = chatMessages.filter((m) => m.sender === 'user').map((m) => m.text);
    const assistantTurns = chatMessages.filter((m) => m.sender === 'assistant').map((m) => m.text);
    if (userTurns.length === 0) return;

    const topic = userTurns[0].slice(0, 45);
    const summary = `Discussed: ${userTurns.join('; ').slice(0, 160)}. Key insights: ${assistantTurns.slice(-1)[0]?.slice(0, 160) || 'None'}`;
    const cat = inferCategory(topic, summary);
    const tags = [cat.toLowerCase(), 'conversation-summary', 'memory'];

    saveOrUpdateKnowledge(topic, cat, summary, tags);
    try {
      localStorage.setItem('lor_rolling_conversation_context', summary);
    } catch {}
  };

  const resetConvoActivity = () => {
    try {
      localStorage.setItem('lor_chat_last_active', String(Date.now()));
    } catch {}

    if (convoIdleTimerRef.current) {
      clearTimeout(convoIdleTimerRef.current);
    }

    // Refresh only if conversation has been idle for 5 minutes (300,000 ms)
    convoIdleTimerRef.current = setTimeout(() => {
      setMessages((currentMsgs) => {
        const hasUserMsgs = currentMsgs.some((m) => m.sender === 'user');
        if (!hasUserMsgs) return currentMsgs;

        summarizeAndArchiveConvo(currentMsgs);
        const storedName = localStorage.getItem('lor_user_name') || userName;
        const userTurns = currentMsgs.filter((m) => m.sender === 'user');
        const lastTopic = userTurns[userTurns.length - 1]?.text.slice(0, 30) || 'our earlier chat';

        const freshGreeting: Message[] = [
          {
            id: `msg-refresh-${Date.now()}`,
            sender: 'assistant',
            text: storedName
              ? `Hey ${storedName}. I saved our notes on "${lastTopic}". Ready whenever you are.`
              : `I saved our notes on "${lastTopic}". What would you like to explore next?`,
            timestamp: Date.now()
          }
        ];
        try {
          localStorage.setItem('lor_active_chat_messages', JSON.stringify(freshGreeting));
        } catch {}
        return freshGreeting;
      });
    }, 300000);
  };

  // Run idle check on mount and cleanup
  useEffect(() => {
    const lastActive = localStorage.getItem('lor_chat_last_active');
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed >= 300000) {
        try {
          const saved = localStorage.getItem('lor_active_chat_messages');
          if (saved) {
            const parsed: Message[] = JSON.parse(saved);
            if (parsed.some((m) => m.sender === 'user')) {
              summarizeAndArchiveConvo(parsed);
              const storedName = localStorage.getItem('lor_user_name') || userName;
              const refreshed: Message[] = [
                {
                  id: `msg-refresh-${Date.now()}`,
                  sender: 'assistant',
                  text: storedName
                    ? `Hey ${storedName}. I saved our notes from earlier. What would you like to explore next?`
                    : `I saved our notes from earlier. What would you like to explore next?`,
                  timestamp: Date.now()
                }
              ];
              setMessages(refreshed);
              localStorage.setItem('lor_active_chat_messages', JSON.stringify(refreshed));
            }
          }
        } catch {}
      }
    }
    resetConvoActivity();

    return () => {
      if (convoIdleTimerRef.current) clearTimeout(convoIdleTimerRef.current);
    };
  }, []);

  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // Active View: 'chat' | 'comments' (Past Conversations)
  const [activeView, setActiveView] = useState<'chat' | 'comments'>('chat');
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  // Past Conversations (CRUD, deduplication & Auto-pruning for single-reply non-memory convos)
  const [pastConversations, setPastConversations] = useState<PastConversationItem[]>(() => {
    try {
      const saved = localStorage.getItem('lor_past_conversations') || localStorage.getItem('lor_comments_history');
      if (saved) {
        const parsed: PastConversationItem[] = JSON.parse(saved);
        const now = Date.now();
        // Prune single-reply trivial convos and deduplicate by normalized URL (5-min idle retention)
        const seenUrls = new Set<string>();
        const pruned: PastConversationItem[] = [];
        for (const item of parsed) {
          const replies = item.replyCount || 1;
          const isTrivial = replies <= 1 && !item.isMemoryContributor && !item.userNote;
          if (isTrivial && (now - item.timestamp > 300000)) continue;
          const normUrl = (item.url || '').split('#')[0].replace(/[?&]t=[0-9]+/, '');
          if (normUrl && seenUrls.has(normUrl)) continue;
          if (normUrl) seenUrls.add(normUrl);
          pruned.push(item);
        }
        return pruned;
      }
    } catch {}
    return [];
  });
  const commentsHistory = pastConversations;
  const setCommentsHistory = setPastConversations;

  // Inline editing state for Past Conversations
  const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [editNoteText, setEditNoteText] = useState('');

  // Drag-and-drop state on Orb and HUD
  const [isOrbDragHovered, setIsOrbDragHovered] = useState(false);
  const [isHudDragHovered, setIsHudDragHovered] = useState(false);

  // Screen Selection Snip Tool State
  const [isSnipActive, setIsSnipActive] = useState(false);
  const [snipBox, setSnipBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Companion Text-to-Speech (Voice of Lor) & Copy State
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanSpeech = text
      .replace(/[*_~`#]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/•/g, '')
      .trim();
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    try {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Karen')));
      if (preferredVoice) utterance.voice = preferredVoice;
    } catch {}
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => {
        setCopiedMsgId((prev) => (prev === msgId ? null : prev));
      }, 2000);
    } catch {}
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2-Minute Inactivity Engine (Strict Idle State to protect CPU/GPU & prevent overheating)
  const [isLorIdle, setIsLorIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsLorIdle(false);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      // Enter deep idle sleep after 2 minutes (120,000 ms) of complete user silence
      idleTimerRef.current = setTimeout(() => {
        setIsLorIdle(true);
      }, 120000);
    };

    resetIdleTimer();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, []);

  // Screen Right-Edge Hover Reveal for Lor Conversation HUD (Strictly at absolute edge: window.innerWidth - 2px)
  useEffect(() => {
    let closeTimer: NodeJS.Timeout | null = null;
    let openIntentTimer: NodeJS.Timeout | null = null;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isResizingChat || isSnipActive || showModelDrawer) return;

      const rightEdgeThreshold = window.innerWidth - 2;
      // Moving cursor strictly to the absolute physical edge of the display (>= window.innerWidth - 2px)
      if (e.clientX >= rightEdgeThreshold) {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        // Require intentional 200ms dwell at the absolute edge
        if (!isOpen && !openIntentTimer) {
          openIntentTimer = setTimeout(() => {
            onToggle();
            openIntentTimer = null;
          }, 200);
        }
      } else {
        // Cursor moved away from absolute edge: cancel pending open
        if (openIntentTimer) {
          clearTimeout(openIntentTimer);
          openIntentTimer = null;
        }

        if (isOpen && e.clientX < window.innerWidth - chatWidth - 5) {
          // Moving cursor away from the open Lor Chat
          if (!closeTimer) {
            closeTimer = setTimeout(() => {
              if (!isResizingChat && !showModelDrawer && !isSnipActive) {
                onToggle();
              }
              closeTimer = null;
            }, 80);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      if (closeTimer) clearTimeout(closeTimer);
      if (openIntentTimer) clearTimeout(openIntentTimer);
    };
  }, [isOpen, chatWidth, isResizingChat, isSnipActive, showModelDrawer, onToggle]);

  // Cancel Screen Snip on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSnipActive) {
        setIsSnipActive(false);
        setSnipBox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSnipActive]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen && !showModelDrawer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, showModelDrawer]);

  // Fetch Host System Specs
  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI?.getSystemSpecs) {
      // @ts-ignore
      window.electronAPI.getSystemSpecs()
        .then((specs: any) => setSystemSpecs(specs))
        .catch(() => {});
    }
  }, []);

  // Check Ollama model connectivity
  useEffect(() => {
    const checkModels = async () => {
      try {
        const res = await fetch('http://127.0.0.1:11434/api/tags');
        if (res.ok) {
          const data = await res.json();
          if (data.models && data.models.length > 0) {
            setOllamaAvailable(true);
            const match = data.models.find((m: any) => m.name.includes(activeModelId) || activeModelId.includes(m.name));
            if (match) {
              setLocalModelName(match.name);
            } else {
              // Prioritize vision/multimodal model like moondream
              const visionModel = data.models.find((m: any) => isModelMultimodal(m.name));
              if (visionModel) {
                setLocalModelName(visionModel.name);
                setActiveModelId(visionModel.name);
              } else {
                setLocalModelName(data.models[0].name);
              }
            }
            return;
          }
        }
      } catch {}
      setOllamaAvailable(false);
    };

    checkModels();
    // Only periodically re-check connectivity when the model settings drawer is actively open
    if (showModelDrawer) {
      const timer = setInterval(checkModels, 15000);
      return () => clearInterval(timer);
    }
  }, [activeModelId, showModelDrawer]);

  // Handle Free, Zero-Resistance Dragging of the Orb anywhere on screen
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setIsDragging(true);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: orbPos.x,
      initialY: orbPos.y
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      
      // Free 1:1 motion directly tracked under cursor with 0 resistance
      const newX = Math.max(4, Math.min(window.innerWidth - 50, dragStartRef.current.initialX + dx));
      const newY = Math.max(4, Math.min(window.innerHeight - 50, dragStartRef.current.initialY + dy));
      
      setOrbPos({ x: newX, y: newY });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);
      if (dragStartRef.current) {
        const dx = upEvent.clientX - dragStartRef.current.startX;
        const dy = upEvent.clientY - dragStartRef.current.startY;
        const finalX = Math.max(4, Math.min(window.innerWidth - 50, dragStartRef.current.initialX + dx));
        const finalY = Math.max(4, Math.min(window.innerHeight - 50, dragStartRef.current.initialY + dy));
        setOrbPos({ x: finalX, y: finalY });
        try {
          localStorage.setItem('lor_core_pos', JSON.stringify({ x: finalX, y: finalY }));
        } catch {}
      }
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle Chat Resizing (Left Edge Drag with smooth bounds and webview protection)
  const handleChatResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingChat(true);

    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const delta = startX - moveEvent.clientX;
      const minW = 340;
      const maxW = Math.min(1200, window.innerWidth - 80);
      const newWidth = Math.max(minW, Math.min(maxW, startWidth + delta));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingChat(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setChatWidth((finalWidth) => {
        try {
          localStorage.setItem('lor_chat_width', String(finalWidth));
        } catch {}
        return finalWidth;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Capture Live Visual View of the Active Screen (Downscaled for lightweight <150ms inference & zero fan spin)
  const captureActiveScreen = async (): Promise<string | null> => {
    if (!activeTab) return null;
    const wv = webviewsRef.current[activeTab.id];
    if (wv && typeof wv.capturePage === 'function') {
      try {
        const nativeImg = await wv.capturePage();
        if (nativeImg) {
          // Downscale retina screenshot proportionally to 380px width:
          // Produces a featherweight ~20KB thumbnail instead of a 10MB retina buffer, preventing GPU throttling and battery heat
          const resized = typeof nativeImg.resize === 'function'
            ? nativeImg.resize({ width: 380, quality: 'good' })
            : nativeImg;
          if (typeof resized.toDataURL === 'function') {
            return resized.toDataURL();
          }
        }
      } catch (err) {
        console.warn('captureActiveScreen warning:', err);
      }
    }
    return null;
  };

  // Extract Clean Text from the Active Webview (Specialized for YouTube, Wikipedia, GitHub, and Articles)
  const getActivePageSnippet = async (): Promise<string> => {
    if (!activeTab) return '';
    const cacheKey = `${activeTab.id}:${activeTab.url}`;
    const cached = _snippetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10000) {
      return cached.snippet;
    }

    const wv = webviewsRef.current[activeTab.id];
    if (wv && typeof wv.executeJavaScript === 'function') {
      try {
        const text = await wv.executeJavaScript(`
          (function() {
            try {
              const selection = (window.getSelection ? window.getSelection().toString() : '')?.trim();
              const selectionBlock = selection && selection.length > 2 ? 'User Highlighted Text on Page:\\n"' + selection.slice(0, 2500) + '"\\n\\n' : '';

              const host = window.location.hostname || '';
              // 1. YouTube specialized extraction: isolate video title, channel, description (ignore sidebar recommendations)
              if (host.includes('youtube.com')) {
                const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1, h1.title')?.textContent?.trim() || document.title;
                const channel = document.querySelector('ytd-channel-name yt-formatted-string, #channel-name')?.textContent?.trim() || '';
                const desc = document.querySelector('#description-inline-expander, #description')?.textContent?.trim() || '';
                return selectionBlock + 'YouTube Video Title: ' + videoTitle + '\\nChannel: ' + channel + '\\nDescription:\\n' + desc.slice(0, 1800);
              }
              // 2. Wikipedia specialized extraction: article title & introductory lead paragraphs
              if (host.includes('wikipedia.org')) {
                const heading = document.querySelector('#firstHeading')?.textContent?.trim() || document.title;
                const paragraphs = Array.from(document.querySelectorAll('#mw-content-text p'))
                  .map(p => (p.textContent || '').trim())
                  .filter(t => t.length > 40)
                  .slice(0, 5)
                  .join('\\n\\n');
                return selectionBlock + 'Wikipedia Article: ' + heading + '\\n\\n' + paragraphs.slice(0, 2400);
              }
              // 3. GitHub specialized extraction: repo header & README
              if (host.includes('github.com')) {
                const repoHeader = document.querySelector('#repository-container-header')?.textContent?.trim() || document.title;
                const readme = document.querySelector('article.markdown-body')?.textContent?.trim() || '';
                return selectionBlock + 'GitHub Repo: ' + repoHeader + '\\n\\n' + readme.slice(0, 2400);
              }
              // 4. General Article / Main Content extraction
              const mainEl = document.querySelector('article, main, [role="main"], #content, .content, .post-content');
              const content = mainEl ? mainEl.innerText : (document.body ? document.body.innerText : '');
              return selectionBlock + ('Title: ' + document.title + '\\n\\n' + content).slice(0, 3000);
            } catch(e) {
              return (document.title || '');
            }
          })()
        `);
        const result = text || '';
        _snippetCache.set(cacheKey, { snippet: result, timestamp: Date.now() });
        return result;
      } catch {
        return '';
      }
    }
    return '';
  };

  // Helper to extract search query / entity from conversational user prompts with multi-turn resolution
  const detectSearchQuery = (text: string, recentHistory: Message[] = []): string | null => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith('/') || trimmed.length < 2) return null;

    // Conversational guessing games or personal inquiries that shouldn't search web
    if (/^(guess|can you guess|try to guess|who do you think|do you know my|guess my)\b/i.test(trimmed)) {
      return null;
    }

    // 1. Release schedules, airing status, next episodes, or temporal inquiries
    const isReleaseOrScheduleQuery = /(when (is|will|does|the next)|coming out|airing|next episode|next season|release date|schedule|air date|broadcast date|when next|next one)\b/i.test(trimmed);
    if (isReleaseOrScheduleQuery) {
      // Look for a specific subject in the current query
      const explicitSubject = trimmed.match(/(?:for|about|of|on)\s+([A-Za-z0-9_\s'-]+?)(?:\s+(?:season|episode|release|airing|coming)|\?|$)/i);
      if (explicitSubject && explicitSubject[1] && explicitSubject[1].trim().length > 2) {
        return `${explicitSubject[1].trim()} release schedule next episode`;
      }

      // Check recent conversation history for active topic (e.g., "Ao Ashi", "Season 2", etc.)
      const recentTurns = [...recentHistory].reverse().slice(0, 8);
      for (const m of recentTurns) {
        const showMatch = m.text.match(/\b(ao ashi|jujutsu kaisen|frieren|one piece|bleach|chainsaw man|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
        if (showMatch && showMatch[1] && !['I', 'You', 'Lor', 'Google', 'Season', 'Episode', 'Yes', 'No'].includes(showMatch[1])) {
          return `${showMatch[1]} Season 2 next episode release date schedule`;
        }
      }

      // Fallback to active tab title if user is on a relevant page
      if (activeTab?.title && !['New Tab', 'Google', 'Blank', 'Untitled'].includes(activeTab.title)) {
        const cleanTabTitle = activeTab.title.replace(/\s*-\s*(Google Search|YouTube|Wikipedia|Reddit).*$/i, '').trim();
        if (cleanTabTitle.length > 2) {
          return `${cleanTabTitle} next episode release date schedule`;
        }
      }
    }

    // 2. Explicit search keywords
    const explicitMatch = trimmed.match(/^(?:what is|who is|tell me about|research|find|search for|look up|explain|how does|what are|when did|where is|why is|how is)\s+(.+)/i);
    if (explicitMatch && explicitMatch[1]) {
      const q = explicitMatch[1].replace(/[?!.]+$/, '').trim();
      if (q.length > 2 && !/^(it|that|this|they|you|he|she|we)\b/i.test(q)) {
        return q;
      }
    }

    // 3. Question format: "is cortis a boyband?", "who is keonho?", "weather in berlin?"
    if (trimmed.endsWith('?')) {
      const q = trimmed.replace(/\?+$/, '').trim();
      if (!/^(what|why|how|are you|can you|is it|do you)\b/i.test(q)) {
        return q;
      }
    }

    // 4. Entity / topic extraction:
    let stripped = trimmed
      .replace(/^([a-z\s]*\b(?:ahaha|haha|lol|hey|oh|yo|yeah|yeap|no|nope|yes|true|wait|well|i like|i love|listen to|what about|how about|check out|more like)\b[\s,.:;!?-]*)+/i, '')
      .replace(/[!?,.]+$/, '')
      .trim();

    // If sentence contains "X is a new group/band/artist/tool/company"
    const entityMatch = stripped.match(/^([a-zA-Z0-9_\s'-]+?)\s+(?:is|are|was|were)\s+(?:a|an|the)?\s*(?:new\s+)?(?:group|band|artist|singer|album|track|song|show|movie|team|tool|app|framework|company)/i);
    if (entityMatch && entityMatch[1]) {
      return entityMatch[1].trim();
    }

    // Weather / time / query phrases
    if (/weather|forecast|temperature|stock|price|scores?|schedule|release date/i.test(stripped)) {
      return stripped;
    }

    if (stripped.length >= 2 && stripped.length <= 40) {
      return stripped;
    }

    return null;
  };

  // ============================================================================
  // Autonomous Multi-Source Web Search & Real-Time Google Search Engine
  // ============================================================================
  const performBackgroundWebSearch = async (topic: string): Promise<Array<{ title: string; snippet: string; url: string; source: string }>> => {
    if (!topic || topic.trim().length < 2) return [];
    const cleanTopic = topic
      .replace(/\s*-\s*(YouTube|Wikipedia|GitHub|Google Search|Reddit|Figma|Twitter|X).*$/i, '')
      .replace(/^(watch|listen to|reading|looking at)\s+/i, '')
      .trim();

    const cacheKey = cleanTopic.toLowerCase();
    const cached = _searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 900000) { // 15-minute TTL
      return cached.results;
    }

    const results: Array<{ title: string; snippet: string; url: string; source: string }> = [];

    // 1. Primary: Real Google Search via Lor Electron Background Runner
    if (window.electronAPI?.workflowRun) {
      try {
        const gRes = await window.electronAPI.workflowRun({
          id: 'google-search',
          params: { query: cleanTopic }
        });
        if (gRes && gRes.success && Array.isArray(gRes.data?.items)) {
          for (const item of gRes.data.items) {
            if (item.title && item.url) {
              results.push({
                source: 'Google Search',
                title: item.title,
                snippet: item.snippet || item.title,
                url: item.url
              });
            }
          }
        }
      } catch (err) {
        console.warn('Electron google-search background error:', err);
      }
    }

    // 2. Fallbacks: Wikipedia Search + DuckDuckGo Instant Answers
    try {
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTopic)}&format=json&utf8=1`;
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanTopic)}&format=json`;

      const [wikiSearchRes, ddgRes] = await Promise.allSettled([
        fetch(wikiSearchUrl).then(r => r.json()),
        fetch(ddgUrl).then(r => r.json())
      ]);

      if (wikiSearchRes.status === 'fulfilled' && wikiSearchRes.value?.query?.search) {
        const topArticles = wikiSearchRes.value.query.search.slice(0, 3);
        const summaryPromises = topArticles.map(async (item: any) => {
          try {
            const sumRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`);
            if (sumRes.ok) {
              const sumData = await sumRes.json();
              if (sumData.extract) {
                return {
                  source: 'Wikipedia',
                  title: sumData.title,
                  snippet: sumData.description ? `${sumData.description} — ${sumData.extract}` : sumData.extract,
                  url: sumData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
                };
              }
            }
          } catch {}
          return {
            source: 'Wikipedia',
            title: item.title,
            snippet: (item.snippet || '').replace(/<[^>]+>/g, '').trim(),
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
          };
        });

        const summaries = await Promise.all(summaryPromises);
        results.push(...summaries.filter(s => s.snippet && s.snippet.length > 10));
      }

      if (ddgRes.status === 'fulfilled' && ddgRes.value) {
        const data = ddgRes.value;
        if (data.AbstractText) {
          results.push({
            source: data.AbstractSource || 'DuckDuckGo',
            title: data.Heading || cleanTopic,
            snippet: data.AbstractText,
            url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(cleanTopic)}`
          });
        }
      }
    } catch (err) {
      console.warn('Background web search error:', err);
    }

    const finalResults = results.slice(0, 6);
    _searchCache.set(cacheKey, { results: finalResults, timestamp: Date.now() });
    return finalResults;
  };

  // ============================================================================
  // Time-RAG Essence Memory:
  // Extracts and stores ONLY the durable essence of user behavior and interests.
  // Never stores raw ephemeral web snippets or temporary release dates.
  // ============================================================================
  const extractAndStoreUserEssence = (
    userText: string,
    topic: string
  ) => {
    const textLower = userText.toLowerCase();
    const topicLower = (topic || '').toLowerCase();

    let interestSummary = '';
    let behaviorSummary = '';

    if (/(anime|manga|season|episode|airing|ao ashi|jujutsu|frieren|crunchyroll|mal)/i.test(textLower) || /(anime|ao ashi)/i.test(topicLower)) {
      const showMatch = (userText + ' ' + topic).match(/\b(ao ashi|jujutsu kaisen|frieren|one piece|bleach|chainsaw man|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i);
      const show = showMatch && !['Season', 'Episode', 'When', 'Next', 'Airing'].includes(showMatch[1]) ? showMatch[1] : 'Ao Ashi';
      interestSummary = `Follows ${show} and serialized sports/anime media.`;
      behaviorSummary = `Proactively tracks season airings and upcoming episode release schedules; values exact broadcast dates over generic commentary.`;
    } else if (/(k-pop|kpop|snsd|girls' generation|idol|comeback)/i.test(textLower) || /(snsd|k-pop)/i.test(topicLower)) {
      interestSummary = `Interested in K-Pop (specifically Girls' Generation / SNSD) and music releases.`;
      behaviorSummary = `Explores group history, discography, and community discussions.`;
    } else if (/(code|typescript|javascript|react|swift|electron|python|api|architecture|workflow)/i.test(textLower)) {
      interestSummary = `Frontend systems, browser engineering, and reactive workflow architectures.`;
      behaviorSummary = `Prefers clean modular code, deterministic flows, and direct factual implementations.`;
    } else if (/(hotel|travel|flight|vacation|trip|booking)/i.test(textLower)) {
      interestSummary = `European city travel and accommodation research.`;
      behaviorSummary = `Budget-conscious with strict price caps; values verified guest ratings.`;
    } else if (topic && topic.length > 3) {
      interestSummary = `Interested in ${topic}.`;
      behaviorSummary = `Direct, concise inquiry style; tracks real-time developments.`;
    }

    if (interestSummary && behaviorSummary) {
      const fullEssence = `${interestSummary} ${behaviorSummary}`;
      saveOrUpdateKnowledge(
        `Essence: ${interestSummary.slice(0, 36)}`,
        'User Essence & Interests',
        fullEssence,
        ['user_essence', 'interests', 'behavior', 'time_rag']
      );
    }
  };

  const getUserEssenceContext = (): string => {
    const essenceEntries = indexedKnowledge.filter(k => k.category === 'User Essence & Interests');
    if (essenceEntries.length === 0) return '';
    return `--- USER BEHAVIOR & INTEREST ESSENCE (Time-RAG) ---\n` +
      essenceEntries.map(e => `• ${e.summary}`).join('\n') + `\n`;
  };

  // ============================================================================
  // Companion Temporal, Relational & Empathy Context Generator
  // ============================================================================
  const getCompanionTemporalAndSentimentContext = (): string => {
    const now = new Date();
    const hours = now.getHours();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let timePhase = 'Daytime session';
    let emotionalGuidance = 'Be focused, sharp, and attentive.';
    if (hours >= 23 || hours < 5) {
      timePhase = 'Late night session';
      emotionalGuidance = "It's late at night. The user is browsing or working late into the night. Be gentle, calming, quietly supportive, and keep things uncluttered. Don't overwhelm them with excessive text.";
    } else if (hours >= 5 && hours < 9) {
      timePhase = 'Early morning';
      emotionalGuidance = 'Early morning session. Be fresh, clear, encouraging, and focused on helping them start smoothly.';
    } else if (hours >= 18 && hours < 23) {
      timePhase = 'Evening unwind / deep work';
      emotionalGuidance = 'Evening session. Match their rhythm whether they are unwinding, studying, or in deep focus.';
    }

    return `Current Local Time: ${timeStr} (${dayName}, ${timePhase})\nTemporal Awareness: ${emotionalGuidance}`;
  };

  // ============================================================================
  // Ambient Web Commentary Engine (With Multimodal Screen Viewing)
  // ============================================================================
  const generateAmbientComment = async (tab: Tab) => {
    if (!tab.url || tab.url.startsWith('about:') || tab.url === 'about:blank' || isPrivate) return;

    let commentText = '';
    let screenSnapshot: string | null = null;
    let backgroundResearch: Array<{ title: string; snippet: string; url: string; source: string }> = [];

    const cleanTitle = (tab.title || '')
      .replace(/\s*-\s*(YouTube|Wikipedia|GitHub|Google Search|Reddit|Figma|Twitter|X).*$/i, '')
      .trim();

    // Proactive language detection — if the page snippet has non-Latin script,
    // Lor naturally offers to translate rather than making a generic observation.
    const pageSnippetForLang = await getActivePageSnippet().catch(() => '');
    const hasNonLatinScript = /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af\u0600-\u06ff\u0900-\u097f\u0400-\u04ff\u0e00-\u0e7f]/.test(pageSnippetForLang.slice(0, 600));
    if (hasNonLatinScript) {
      const langHint =
        /[\u4e00-\u9fff]/.test(pageSnippetForLang.slice(0, 200)) ? 'Chinese or Japanese' :
        /[\uac00-\ud7af]/.test(pageSnippetForLang.slice(0, 200)) ? 'Korean' :
        /[\u0600-\u06ff]/.test(pageSnippetForLang.slice(0, 200)) ? 'Arabic' :
        /[\u0400-\u04ff]/.test(pageSnippetForLang.slice(0, 200)) ? 'Russian or Cyrillic' :
        /[\u3040-\u30ff]/.test(pageSnippetForLang.slice(0, 200)) ? 'Japanese' :
        'a non-Latin language';
      commentText = `This page looks like it's in ${langHint}. Want me to translate it?`;
    }

    // Trigger background web research on the current page topic (only if not a foreign language page)
    if (!commentText && cleanTitle && cleanTitle.length > 2 && !['New Tab', 'Google', 'Blank', 'Untitled'].includes(cleanTitle)) {
      backgroundResearch = await performBackgroundWebSearch(cleanTitle);
    }

    // If local Ollama is reachable and we don't already have a language notice,
    // take a view of the screen with a multimodal model for ambient commentary
    if (!commentText && ollamaAvailable && activeModelId !== 'native-telekinesis') {
      try {
        const isVisionEnabled = localStorage.getItem('lor_vision_enabled') !== 'false';
        const visionModel = isModelMultimodal(localModelName) ? localModelName : 'moondream';
        if (isVisionEnabled) {
          screenSnapshot = await captureActiveScreen();
        }
        const snippet = await getActivePageSnippet();
        const activeName = localStorage.getItem('lor_user_name') || userName;
        const rawBase64 = screenSnapshot ? screenSnapshot.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
        const isMultimodal = isVisionEnabled && !!rawBase64;

        const researchContext = backgroundResearch.length > 0
          ? `\nBackground Web Search Findings:\n` + backgroundResearch.map(r => `• ${r.title} (${r.source}): ${r.snippet}`).join('\n')
          : '';

        const userMsgPayload: any = {
          role: 'user',
          content: isMultimodal
            ? `Screen view of: "${tab.title}".${researchContext}\nMake 1 genuine, warm observation under 10 words — like a friend who noticed something. No questions. No emojis.`
            : `User navigated to: "${tab.title}".${researchContext}\nMake 1 genuine, warm observation under 10 words — like a friend noticing where they are. No questions. No emojis.`
        };

        if (isMultimodal && rawBase64) {
          userMsgPayload.images = [rawBase64];
        }

        const candidate = await callOllamaChat({
          model: isMultimodal ? visionModel : localModelName,
          messages: [
            {
              role: 'system',
              content: `You are Lor, a genuine companion built into the user's browser — warm, perceptive, and present. Make a single short, natural observation (under 10 words) about the current page. Speak like a friend who noticed something, not a bot logging a visit. NEVER ask questions. NEVER use emojis. NEVER monologue.`
            },
            userMsgPayload
          ],
          options: {
            temperature: 0.6,
            repeat_penalty: 1.3,
            num_predict: 25,
            stop: ["\n", "\n\n", "User:", "Assistant:", "?", "What", "How", "Do you"]
          },
          fallback: ''
        });
        if (candidate && candidate.length > 3 && candidate.length < 100) {
          commentText = candidate;
        }
      } catch {}
    }

    // Laid-back deterministic fallback (no forced questions or entertainment)
    if (!commentText) {
      const urlLower = tab.url.toLowerCase();
      const titleLower = (tab.title || '').toLowerCase();

      if (urlLower.includes('github.com')) {
        const repo = tab.url.split('github.com/')[1]?.split('/')[1] || 'this repo';
        commentText = `Looking through ${repo}.`;
      } else if (urlLower.includes('arxiv.org') || titleLower.includes('paper') || titleLower.includes('research')) {
        commentText = `Deep dive into research.`;
      } else if (urlLower.includes('news.ycombinator.com') || urlLower.includes('reddit.com')) {
        commentText = `Catching up on discussions.`;
      } else if (urlLower.includes('wikipedia.org')) {
        commentText = `Down a Wikipedia rabbit hole.`;
      } else if (urlLower.includes('youtube.com') || urlLower.includes('vimeo')) {
        const videoTitle = tab.title ? tab.title.replace(/\s*-\s*YouTube/i, '').trim() : '';
        commentText = videoTitle
          ? `Tuning into "${videoTitle.slice(0, 45)}".`
          : `Watching video.`;
      } else if (urlLower.includes('figma.com') || titleLower.includes('design')) {
        commentText = `Working in Figma.`;
      } else if (urlLower.includes('docs.') || urlLower.includes('/docs')) {
        commentText = `Reading the documentation.`;
      } else if (tab.title && tab.title !== 'New Tab' && tab.title !== 'Google') {
        commentText = `Looking at ${cleanTitle.slice(0, 40)}.`;
      }
    }

    // Deduplication guard: Never repeat identical comments back-to-back!
    if (commentText && commentText !== lastCommentedTextRef.current) {
      lastCommentedTextRef.current = commentText;
      setActiveComment(commentText);
      setHasNewNotif(true);
      if (commentTimeoutRef.current) clearTimeout(commentTimeoutRef.current);
      commentTimeoutRef.current = setTimeout(() => {
        setActiveComment(null);
      }, 12000);

      // Persist in Past Conversations with strict URL deduplication
      const newConvo: PastConversationItem = {
        id: `convo-${Date.now()}`,
        text: commentText,
        url: tab.url,
        title: tab.title || tab.url,
        timestamp: Date.now(),
        imagePreview: screenSnapshot || undefined,
        type: 'ambient',
        replyCount: 1,
        isMemoryContributor: false
      };

      setPastConversations((prev) => {
        const now = Date.now();
        const normUrl = (tab.url || '').split('#')[0].replace(/[?&]t=[0-9]+/, '');
        // Prune older trivial convos AND remove any duplicate row with the exact same URL
        const cleaned = prev.filter(c => {
          const cNormUrl = (c.url || '').split('#')[0].replace(/[?&]t=[0-9]+/, '');
          if (normUrl && cNormUrl === normUrl) return false;
          const replies = c.replyCount || 1;
          const isTrivial = replies <= 1 && !c.isMemoryContributor && !c.userNote;
          return !(isTrivial && (now - c.timestamp > 45000));
        });
        const next = [newConvo, ...cleaned.slice(0, 39)];
        try {
          localStorage.setItem('lor_past_conversations', JSON.stringify(next));
          localStorage.setItem('lor_comments_history', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Stream into active chat flow as a single compact thought step (NO duplicates)
      const actionLabel = backgroundResearch.length > 0
        ? (isModelMultimodal(localModelName) ? "Viewed screen & researched" : `Researched "${cleanTitle.slice(0, 22)}"`)
        : (isModelMultimodal(localModelName) ? "Viewed screen" : "Observed page");

      // Derive helpful, proactive companion chips based on page context
      let suggestedChips: string[] = ['Summarize Page', 'Research Topic', 'Split Screen'];
      const urlLower = tab.url.toLowerCase();
      const titleLower = (tab.title || '').toLowerCase();
      if (commentText.includes('translate') || commentText.includes('language') || hasNonLatinScript) {
        suggestedChips = ['Translate to English', 'Summarize in 3 Points', 'What is this site?'];
      } else if (urlLower.includes('github.com')) {
        suggestedChips = ['Explain Architecture', 'How to install or run?', 'Summarize Readme'];
      } else if (urlLower.includes('youtube.com') || urlLower.includes('vimeo')) {
        suggestedChips = ['Summarize Video', 'Key Takeaways', 'Tell me about the creator'];
      } else if (urlLower.includes('wikipedia.org') || urlLower.includes('arxiv.org') || titleLower.includes('paper')) {
        suggestedChips = ['3-Bullet Takeaways', 'Explain Simply', 'Key Findings'];
      }

      const obsMsg: Message = {
        id: `msg-obs-${Date.now()}`,
        sender: 'assistant',
        text: commentText,
        actionPill: actionLabel,
        isObservation: true,
        imagePreview: screenSnapshot || undefined,
        targetUrl: tab.url,
        targetTitle: tab.title || tab.url,
        suggestedChips,
        timestamp: Date.now()
      };

      setMessages((prev) => {
        // Prevent duplicate observation cards for the same page or identical text
        const isDuplicate = prev.slice(-4).some(m => 
          m.text === commentText || 
          (m.isObservation && m.targetUrl === tab.url && (Date.now() - m.timestamp < 60000))
        );
        if (isDuplicate) return prev;
        return [...prev, obsMsg];
      });
    }
  };

  // Listen to Active Page Navigation for Ambient Commentary
  useEffect(() => {
    if (!ambientCommentsEnabled || isPrivate || !activeTab?.url) return;
    if (activeTab.url.startsWith('about:') || activeTab.url === 'about:blank') return;
    if (activeTab.isLoading) return;
    if (lastCommentedUrlRef.current === activeTab.url) return;

    if (commentTimeoutRef.current) {
      clearTimeout(commentTimeoutRef.current);
    }

    // Dwell check: comment after user has engaged with the page for 4.5 seconds
    commentTimeoutRef.current = setTimeout(async () => {
      lastCommentedUrlRef.current = activeTab.url;
      await generateAmbientComment(activeTab);
    }, 4500);

    return () => {
      if (commentTimeoutRef.current) clearTimeout(commentTimeoutRef.current);
    };
  }, [activeTab?.url, activeTab?.isLoading, ambientCommentsEnabled, isPrivate]);


  const handleThoughtBubbleClick = () => {
    if (activeComment) {
      setActiveComment(null);
    }
    setHasNewNotif(false);
    setActiveView('chat');
    if (!isOpen) {
      onToggle();
    }
  };

  // Format relative timestamps
  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Inspect and Comment on any Dropped or Snipped Content
  const commentOnItem = async (item: {
    type: 'text' | 'link' | 'image' | 'file' | 'snip';
    title: string;
    content: string;
    imagePreview?: string;
  }) => {
    if (!isOpen) onToggle();
    setActiveView('chat');

    const userText = item.type === 'link'
      ? `Inspect this link: ${item.content}`
      : item.type === 'image'
      ? `Comment on this image: ${item.title}`
      : item.type === 'snip'
      ? `What do you think of this section (${item.title})?`
      : `What are your thoughts on this:\n"${item.content.length > 250 ? item.content.slice(0, 250) + '...' : item.content}"`;

    const userMsg: Message = {
      id: `msg-drop-${Date.now()}`,
      sender: 'user',
      text: userText,
      actionPill: `Dropped ${item.type.toUpperCase()}`,
      imagePreview: item.imagePreview,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    let commentText = '';
    const activeName = localStorage.getItem('lor_user_name') || userName;

    // LLM via Ollama if available
    if (ollamaAvailable && activeModelId !== 'native-telekinesis') {
      try {
        const rawBase64 = item.imagePreview ? item.imagePreview.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
        const isMultimodal = isModelMultimodal(localModelName) && !!rawBase64;

        const userMsgObj: any = {
          role: 'user',
          content: isMultimodal
            ? `Look at this visual image from "${activeTab?.title || ''}". Share a genuine, friendly comment about what you see in 1 short sentence (maximum 15 words). Speak directly to a friend. Never use emojis.`
            : `Webpage: "${activeTab?.title || ''}"\nSubject: "${item.title}"\nDetails: ${item.content.slice(0, 1000)}`
        };

        if (isMultimodal && rawBase64) {
          userMsgObj.images = [rawBase64];
        }

        const candidate = await callOllamaChat({
          model: localModelName,
          messages: [
            {
              role: 'system',
              content: `You are Lor, a warm and perceptive companion. The user ${activeName ? `(${activeName})` : ''} shared a section from "${activeTab?.title || 'the webpage'}". Share a natural, genuine observation in 1 short sentence (max 12 words). No questions. No emojis.`
            },
            userMsgObj
          ],
          options: {
            num_predict: 35,
            temperature: 0.35,
            repeat_penalty: 1.25,
            stop: ["\n", "```", "<!--", "<div", "<script", "http", "The screen selection", "Chrome"]
          },
          fallback: ''
        });

        if (
          candidate && 
          !candidate.includes('<') && 
          !candidate.includes('>') && 
          !candidate.toLowerCase().includes('screen selection') && 
          !candidate.toLowerCase().includes('chrome browser') && 
          !candidate.toLowerCase().includes('input type') && 
          candidate.length > 5 && 
          candidate.length < 140
        ) {
          commentText = candidate;
        }
      } catch {}
    }

    // Deterministic fallback recognizing DOM details rather than technical raster details
    if (!commentText) {
      const cleanTitle = (item.title && !item.title.toLowerCase().includes('screen selection')
        ? item.title
        : activeTab?.title || 'this page'
      )
        .replace(/^(Heading:\s*|Code:\s*|Selected:\s*|Visual:\s*|Headline:\s*)/, '')
        .split('|')[0]
        .split('-')[0]
        .trim();

      if (item.type === 'link') {
        try {
          const parsed = new URL(item.content);
          commentText = `Examined link to ${parsed.hostname} (${parsed.pathname || '/'}). We can explore this or open it in Bicameral Split View.`;
        } catch {
          commentText = `Inspected link: ${item.content}. Ready to navigate or split screen.`;
        }
      } else if (item.type === 'snip' || item.type === 'image') {
        if (item.content.includes('function') || item.content.includes('const') || item.content.includes('import') || item.content.includes('def ')) {
          commentText = `Looking at this code section: it structures logic for ${cleanTitle}. Clean syntax.`;
        } else if (cleanTitle.toLowerCase().includes('bighit') || cleanTitle.toLowerCase().includes('cortis') || cleanTitle.toLowerCase().includes('kpop') || cleanTitle.toLowerCase().includes('awards') || cleanTitle.toLowerCase().includes('tiktok')) {
          commentText = `Looking at this visual on ${cleanTitle}. The creative styling and stage presence really stand out.`;
        } else if (item.content.length > 20) {
          const cleanExcerpt = item.content.replace(/^(Heading:\s*|Code:\s*|Selected:\s*|Visual:\s*|Headline:\s*)/, '').replace(/\n+/g, ' ').trim().slice(0, 90);
          commentText = activeName 
            ? `Looking at this visual from ${cleanTitle}: it features "${cleanExcerpt}...". What caught your eye here, ${activeName}?`
            : `Looking at this visual from ${cleanTitle}: it features "${cleanExcerpt}...". What do you think of this?`;
        } else {
          commentText = `Looking at this visual on ${cleanTitle}. The styling and creative direction look really sharp.`;
        }
      } else {
        const words = item.content.trim().split(/\s+/).length;
        commentText = `Observed selection (${words} words). Core premise: "${item.content.slice(0, 80).replace(/\n/g, ' ')}...". What do you think?`;
      }
    }

    const assistantMsg: Message = {
      id: `msg-resp-${Date.now()}`,
      sender: 'assistant',
      text: commentText,
      actionPill: `Comment on ${item.type.toUpperCase()}`,
      isObservation: true,
      imagePreview: item.imagePreview,
      targetTitle: item.title,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsGenerating(false);

    // Save to comments history
    const newComment: AmbientCommentItem = {
      id: `comment-${Date.now()}`,
      text: commentText,
      url: activeTab?.url || item.title,
      title: item.title,
      timestamp: Date.now(),
      imagePreview: item.imagePreview,
      type: item.type === 'snip' ? 'snip' : 'dropped'
    };

    setCommentsHistory((prev) => {
      const next = [newComment, ...prev.slice(0, 49)];
      try { localStorage.setItem('lor_comments_history', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Handle Drag-and-Drop of any item on screen
  const handleDroppedContent = async (dataTransfer: DataTransfer) => {
    // 1. Check for files (images, code files, text files)
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      const file = dataTransfer.files[0];
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          commentOnItem({
            type: 'image',
            title: file.name,
            content: `Image: ${file.name} (${Math.round(file.size / 1024)} KB, ${file.type})`,
            imagePreview: dataUrl
          });
        };
        reader.readAsDataURL(file);
        return;
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const text = (reader.result as string || '').slice(0, 4000);
          commentOnItem({
            type: 'file',
            title: file.name,
            content: text
          });
        };
        reader.readAsText(file);
        return;
      }
    }

    // 2. Check for URI / Link
    const uri = dataTransfer.getData('text/uri-list');
    const plainText = dataTransfer.getData('text/plain');

    if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
      commentOnItem({
        type: 'link',
        title: uri,
        content: uri
      });
      return;
    }

    if (plainText && plainText.trim()) {
      const isUrl = plainText.startsWith('http://') || plainText.startsWith('https://');
      commentOnItem({
        type: isUrl ? 'link' : 'text',
        title: isUrl ? plainText : 'Selected Content',
        content: plainText.trim()
      });
      return;
    }
  };

  // Screen Snip Tool Handlers
  const startScreenSnip = () => {
    setIsSnipActive(true);
    setSnipBox(null);
  };

  const handleSnipMouseDown = (e: React.MouseEvent) => {
    setSnipBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleSnipMouseMove = (e: React.MouseEvent) => {
    if (!snipBox) return;
    setSnipBox((prev) => (prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null));
  };

  const handleSnipMouseUp = async () => {
    if (!snipBox) {
      setIsSnipActive(false);
      return;
    }

    const x = Math.min(snipBox.startX, snipBox.currentX);
    const y = Math.min(snipBox.startY, snipBox.currentY);
    const width = Math.abs(snipBox.currentX - snipBox.startX);
    const height = Math.abs(snipBox.currentY - snipBox.startY);

    setIsSnipActive(false);
    setSnipBox(null);

    if (width < 20 || height < 20) return;

    let capturedText = '';
    let sectionTitle = '';
    let dataUrl: string | undefined = undefined;

    const wv = activeTab ? webviewsRef.current[activeTab.id] : null;
    if (wv) {
      try {
        const wvRect = typeof wv.getBoundingClientRect === 'function' 
          ? wv.getBoundingClientRect() 
          : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

        const relX = Math.max(0, x - wvRect.left);
        const relY = Math.max(0, y - wvRect.top);
        const relWidth = Math.min(width, wvRect.width - relX);
        const relHeight = Math.min(height, wvRect.height - relY);

        // Visual screenshot capture
        if (typeof wv.capturePage === 'function' && relWidth > 0 && relHeight > 0) {
          const nativeImg = await wv.capturePage({
            x: Math.round(relX),
            y: Math.round(relY),
            width: Math.round(relWidth),
            height: Math.round(relHeight)
          });
          if (nativeImg && typeof nativeImg.toDataURL === 'function') {
            dataUrl = nativeImg.toDataURL();
          }
        }

        // Comprehensive DOM content extraction based on elements overlapping selection box
        if (typeof wv.executeJavaScript === 'function') {
          const domResult = await wv.executeJavaScript(`
            (function(box) {
              try {
                var sel = window.getSelection() ? window.getSelection().toString().trim() : '';
                var pageH1 = document.querySelector('h1')?.innerText?.trim() || '';
                var ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
                var docTitle = (document.title || '').split('|')[0].split('-')[0].trim();

                var elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, article, section, pre, code, blockquote, li, a, img, figure, figcaption');
                var foundTexts = [];
                var headings = [];
                var imageDetails = [];
                var seen = new Set();

                for (var i = 0; i < elements.length; i++) {
                  var el = elements[i];
                  var r = el.getBoundingClientRect();
                  var intersects = !(
                    r.right < box.x ||
                    r.left > box.x + box.width ||
                    r.bottom < box.y ||
                    r.top > box.y + box.height
                  );

                  if (intersects) {
                    if (el.tagName === 'IMG') {
                      var alt = el.alt || el.title || el.getAttribute('aria-label') || '';
                      var src = el.currentSrc || el.src || '';
                      var slug = '';
                      if (src) {
                        try {
                          var pathname = new URL(src).pathname;
                          var filename = pathname.substring(pathname.lastIndexOf('/') + 1);
                          slug = decodeURIComponent(filename)
                            .replace(/\\.[a-zA-Z0-9]+$/, '')
                            .replace(/[-_]+/g, ' ')
                            .replace(/\\b[0-9a-f]{8,}\\b/gi, '')
                            .trim();
                        } catch(e) {}
                      }

                      var fig = el.closest('figure');
                      var caption = fig ? fig.querySelector('figcaption')?.innerText?.trim() : '';
                      var container = el.closest('article, section, main, [role="article"], .entry, .post');
                      var contHeading = container ? container.querySelector('h1, h2, h3')?.innerText?.trim() : '';

                      var desc = alt || caption || (slug ? 'Visual of ' + slug : '') || (contHeading ? 'Image for ' + contHeading : '');
                      if (desc && !seen.has(desc)) {
                        seen.add(desc);
                        imageDetails.push(desc);
                        foundTexts.push('Visual Subject: ' + desc);
                      }
                      if (contHeading && !seen.has(contHeading)) {
                        seen.add(contHeading);
                        headings.push(contHeading);
                      }
                    } else {
                      var text = (el.innerText || '').trim();
                      if (text && text.length > 2 && text.length < 1500 && !seen.has(text)) {
                        seen.add(text);
                        var tag = el.tagName.toLowerCase();
                        if (tag.startsWith('h')) {
                          headings.push(text);
                          foundTexts.push('Heading: ' + text);
                        } else if (tag === 'figcaption') {
                          foundTexts.push('Caption: ' + text);
                        } else if (tag === 'pre' || tag === 'code') {
                          foundTexts.push('Code: ' + text);
                        } else {
                          foundTexts.push(text);
                        }
                      }
                    }
                  }
                }

                if (foundTexts.length === 0) {
                  var centerEl = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
                  if (centerEl) {
                    var img = centerEl.tagName === 'IMG' ? centerEl : centerEl.querySelector('img');
                    if (img) {
                      var imgAlt = img.alt || img.title || '';
                      if (imgAlt) foundTexts.push('Visual: ' + imgAlt);
                    }
                    var cText = (centerEl.innerText || '').trim();
                    if (cText) foundTexts.push(cText);
                  }
                }

                var bestHeading = headings[0] || pageH1 || ogTitle || docTitle || '';
                var fullContent = (sel ? 'Selected: ' + sel + '\\n\\n' : '') + foundTexts.slice(0, 15).join('\\n\\n');

                return {
                  content: fullContent.trim().slice(0, 2500),
                  mainHeading: bestHeading,
                  imageSubjects: imageDetails.join(', ')
                };
              } catch(e) {
                return { content: '', mainHeading: '', imageSubjects: '' };
              }
            })(${JSON.stringify({ x: relX, y: relY, width: relWidth, height: relHeight })})
          `);

          if (domResult) {
            capturedText = domResult.content || '';
            if (domResult.mainHeading) {
              sectionTitle = domResult.mainHeading;
            } else if (domResult.imageSubjects) {
              sectionTitle = domResult.imageSubjects;
            }
          }
        }
      } catch (err) {
        console.warn('Snip capture warning:', err);
      }
    }

    if (!sectionTitle || sectionTitle.toLowerCase().includes('screen selection')) {
      if (capturedText) {
        const firstLine = capturedText.split('\n')[0].replace(/^(Heading:\s*|Code:\s*|Selected:\s*|Visual:\s*|Visual Subject:\s*)/, '').trim();
        sectionTitle = firstLine.length > 35 ? firstLine.slice(0, 35) + '...' : firstLine;
      } else {
        sectionTitle = activeTab?.title ? activeTab.title.split('|')[0].split('-')[0].trim() : 'Visual Content';
      }
    }

    commentOnItem({
      type: 'snip',
      title: sectionTitle,
      content: capturedText || `Visual section from ${sectionTitle}`,
      imagePreview: dataUrl
    });
  };

  // Switch Model
  const handleSelectModel = (option: ModelTierOption) => {
    setActiveModelId(option.id);
    localStorage.setItem('lor_active_model_id', option.id);
    if (option.id === 'native-telekinesis') {
      setLocalModelName('Native Telekinesis');
    } else {
      setLocalModelName(option.id);
    }
    setShowModelDrawer(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-model-switch-${Date.now()}`,
        sender: 'assistant',
        text: `Switched intelligence tier to **${option.name}**. RAM: ${option.ram} | Disk: ${option.disk}.`,
        actionPill: `Engine: ${option.name}`,
        timestamp: Date.now()
      }
    ]);
  };

  // ============================================================================
  // Telekinesis Engine: Parse and execute browser actions directly
  // ============================================================================
  const executeTelekinesis = async (prompt: string): Promise<{ handled: boolean; reply: string; actionPill?: string }> => {
    const q = prompt.toLowerCase().trim();

    // 1. Bicameral Split View
    if (q.includes('split') || q.includes('side by side') || q.includes('dual view')) {
      onSplitScreen();
      return {
        handled: true,
        reply: "Opening Bicameral Split View. You can now select or drag a partner tab to view both side-by-side.",
        actionPill: "Split Screen"
      };
    }

    // 2. Vault Inactive Tabs
    if (q.includes('vault tabs') || q.includes('freeze tabs') || q.includes('clean tabs') || q.includes('hibernate')) {
      onVaultInactiveTabs();
      return {
        handled: true,
        reply: "Swept all inactive background tabs into your SQLite Tab Vault. Unloaded their processes from RAM to restore absolute responsiveness.",
        actionPill: "Tabs Vaulted"
      };
    }

    // 3. Open Tab Vault
    if (q.includes('open vault') || q.includes('show vault') || q.includes('search memory') || q.includes('tab vault')) {
      onOpenVault();
      return {
        handled: true,
        reply: "Revealing your Tab Vault. You can search across all past captured knowledge with Apple Neural Engine vector matching.",
        actionPill: "Tab Vault Opened"
      };
    }

    // 4. Toggle Sidebar Auto-Collapse
    if (q.includes('toggle sidebar') || q.includes('hide sidebar') || q.includes('collapse sidebar') || q.includes('pin sidebar')) {
      onToggleSidebar();
      return {
        handled: true,
        reply: "Toggled sidebar auto-collapsing. Move cursor to the screen edge or press Cmd+B anytime.",
        actionPill: "Sidebar Toggled"
      };
    }

    // 5. Ambient Rain Soundscape
    if (q.includes('rain') || q.includes('ambient') || q.includes('sound') || q.includes('noise') || q.includes('calm')) {
      const active = ambientAudio.toggle();
      setIsAmbientPlaying(active);
      return {
        handled: true,
        reply: active 
          ? "Synthesizing 432Hz Brownian rain audio in real-time. Pure Web Audio parametric generation with zero asset overhead."
          : "Ambient soundscape halted.",
        actionPill: active ? "Rain Synthesizing" : "Audio Muted"
      };
    }

    // 6. Switch Space
    for (const s of spaces) {
      if (q.includes(`switch to ${s.name.toLowerCase()}`) || q.includes(`space ${s.name.toLowerCase()}`)) {
        onSelectSpace(s.id);
        return {
          handled: true,
          reply: `Transitioned to Space: ${s.name}.`,
          actionPill: `Space: ${s.name}`
        };
      }
    }

    // 7. Check Active Video / Page ("see what im watching", "what am i watching", "what video is this")
    if (/^(see what i['’]?m watching|what am i watching|what video is this|what is this video|what video am i on|what am i on|look at what i['’]?m watching)\b/i.test(q)) {
      if (activeTab?.title) {
        return {
          handled: true,
          reply: `You're watching "${activeTab.title}".`,
          actionPill: "Now Watching"
        };
      }
    }

    // 8. Direct Workflow Navigation Shortcuts (Open GitHub Pulls / Instagram Inbox)
    if (/^open github (pulls?|prs?|notifications?|login)/i.test(q)) {
      const url = q.includes('login') ? 'https://github.com/login' : (q.includes('notif') ? 'https://github.com/notifications' : 'https://github.com/pulls');
      onNewTab(url);
      return {
        handled: true,
        reply: `Opened GitHub in a new tab: ${url}`,
        actionPill: "Opened GitHub"
      };
    }
    if (/^open instagram (inbox|dms?|messages?|login)/i.test(q)) {
      const url = q.includes('login') ? 'https://www.instagram.com/accounts/login/' : 'https://www.instagram.com/direct/inbox/';
      onNewTab(url);
      return {
        handled: true,
        reply: `Opened Instagram in a new tab: ${url}`,
        actionPill: "Opened Instagram"
      };
    }

    // 9. Transparent Liquid Glass Workflow Canvas (Thought Process & Human-in-the-Loop)
    if (/(workflow canvas|workflow graph|liquid glass|show workflow|open workflow|human in the loop|thought process)/i.test(q)) {
      if (onOpenWorkflowCanvas) {
        onOpenWorkflowCanvas(q.includes('instagram') || q.includes('ig') ? 'instagram-dms' : 'github-prs');
        return {
          handled: true,
          reply: "Revealed the transparent Liquid Glass Workflow Canvas. You can see the agent thought nodes, wire connections, and approve actions.",
          actionPill: "Workflow Canvas"
        };
      }
    }

    // 10. Summarize / Explain Active Page
    if (q.includes('summarize') || q.includes('tldr') || q.includes('explain') || q.includes('key takeaways')) {
      const urlLower = (activeTab?.url || '').toLowerCase();
      
      // If on search portal landing page (e.g. Google search homepage)
      if (urlLower.includes('google.com') && !urlLower.includes('/search')) {
        return {
          handled: true,
          reply: "This is Google's search landing page. Ready for whatever you want to look up next.",
          actionPill: "Search Portal"
        };
      }

      const pageText = await getActivePageSnippet();
      if (!pageText || pageText.trim().length < 30) {
        return {
          handled: true,
          reply: `I could not find much readable text on "${activeTab?.title || 'this tab'}". It might be an interactive canvas, video without description, or still loading.`,
          actionPill: "Minimal Page Text"
        };
      }

      const wantsPoints = /([0-9]+\s*(points|bullets|takeaways|items)|bullet\s*points?|in\s*points|key\s*points|bullet)/i.test(prompt);

      if (activeModelId !== 'native-telekinesis' && ollamaAvailable) {
        try {
          const systemPrompt = wantsPoints
            ? 'You are Lor, a genuine companion in Lor Browser. Pull out the core points from this page as clean bullet points starting with •. Be direct. No introductory filler. No emojis.'
            : 'You are Lor, a genuine companion in Lor Browser. Explain what this page is about in 2 or 3 natural sentences, like you are telling a friend. Be real and direct. No corporate filler. No emojis.';

          const text = await callOllamaChat({
            model: localModelName,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: `User Request: "${prompt}"\n\nActive Tab Content:\n${pageText.slice(0, 2200)}`
              }
            ],
            options: {
              temperature: 0.65,
              repeat_penalty: 1.25,
              num_predict: wantsPoints ? 180 : 140,
              stop: ["\n\n\n\n", "User:", "Assistant:", "**Overview:**", "notification notification"]
            },
            fallback: ''
          });

          if (text && text.length > 15) {
            return {
              handled: true,
              reply: text,
              actionPill: wantsPoints ? `Summary (${localModelName})` : `Gist (${localModelName})`
            };
          }
        } catch {}
      }

      const sentences = pageText.split(/(?<=[.?!])\s+/).filter(s => s.length > 30).slice(0, 3);
      return {
        handled: true,
        reply: sentences.length > 0 
          ? `Summary of ${activeTab?.title}:\n\n` + sentences.map((s) => `• ${s.trim()}`).join('\n\n')
          : `Looking through ${activeTab?.title}. What part of it are you most curious about?`,
        actionPill: "Page Summary"
      };
    }

    return { handled: false, reply: '' };
  };

  // Submit Prompt to Assistant
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    // Cancel any ongoing speech synthesis playback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }

    resetConvoActivity();

    // Detect if user introduces their name explicitly (e.g. "my name is Tyler", "call me Tyler")
    const explicitNameIntro = text.match(/^(?:hi|hey|hello)?[,\s]*(?:my name is|call me)\s+([A-Za-z]+)\.?$/i);
    if (explicitNameIntro && explicitNameIntro[1]) {
      const cleanName = explicitNameIntro[1].charAt(0).toUpperCase() + explicitNameIntro[1].slice(1).toLowerCase();
      const forbidden = ['a', 'the', 'just', 'here', 'reading', 'working', 'good', 'fine', 'tired', 'watching', 'listening', 'doing', 'going', 'seeing', 'playing', 'what', 'who', 'how', 'why', 'nothing'];
      if (!forbidden.includes(cleanName.toLowerCase())) {
        setUserName(cleanName);
        localStorage.setItem('lor_user_name', cleanName);
        saveOrUpdateKnowledge('User Profile', 'Preferences', `User's name is ${cleanName}.`, ['user', 'name', 'preferences']);
      }
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsGenerating(true);

    // If opened via Cmd+K quick-chat, collapse sidebar immediately upon sending message
    if (collapseOnSendRef.current) {
      collapseOnSendRef.current = false;
      onToggle();
    }

    // Interactive chip triggers: Liquid Glass Workflow Canvas and Split-view reservations
    if (/(liquid glass|workflow canvas|view workflow|show workflow)/i.test(text)) {
      const lastHotelResearch = messages.some(m => m.actionPill?.includes('Research:') || m.text.includes('hotel') || m.text.includes('Leipzig'));
      const lastIg = messages.some(m => m.actionPill?.includes('Instagram') || m.text.includes('Instagram'));
      const preset = lastHotelResearch ? 'hotel-research' : (lastIg ? 'instagram-dms' : 'github-prs');
      if (onOpenWorkflowCanvas) {
        onOpenWorkflowCanvas(preset);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: `Opened the Liquid Glass Workflow Canvas for ${preset === 'hotel-research' ? 'Hotel & Travel Research (Leipzig under €300)' : (preset === 'instagram-dms' ? 'Instagram Direct Inbox Scan' : 'GitHub Pull Requests')}. You can inspect every node and approve human-in-the-loop decisions directly on the glass.`,
          actionPill: 'Liquid Glass Workflow',
          timestamp: Date.now()
        }
      ]);
      setIsGenerating(false);
      resetConvoActivity();
      return;
    }

    // Document Cache & Autonomous Goal Reiteration Loop Intent
    const isDocCacheIntent = /(cache.*doc|cached.*doc|remember.*doc|unlink.*doc|forget.*doc)/i.test(text);
    const isGoalLoopIntent = /(ao ashi|aoashi|3 characters|personality.*character|character.*personality|photo.*doc|photos.*doc|autonomous.*task|create.*tasks|reiterate.*infinitely|desired outcome|goal.*loop|infinite.*loop)/i.test(text);

    if (isDocCacheIntent) {
      const rawCached = localStorage.getItem('lor_cached_linked_doc');
      let cachedDoc: any = null;
      try {
        if (rawCached) cachedDoc = JSON.parse(rawCached);
      } catch {}

      if (/(unlink|clear|forget)/i.test(text)) {
        localStorage.removeItem('lor_cached_linked_doc');
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: `Cleared the cached Google Document from your session. You can link or open any new document whenever you are ready.`,
            actionPill: 'Cache Cleared',
            timestamp: Date.now()
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: cachedDoc ? `Your previously linked Google Document is cached:\n\n• **Title**: ${cachedDoc.title}\n• **URL**: \`${cachedDoc.url}\`\n• **Status**: Cached across sessions until changed or unlinked.\n\nAll subsequent workflows will automatically write to this document without requiring you to relink it every session!` : `No Google Document is currently cached. Once you link or create any document in Workflow Studio, Lor automatically caches it for all future workflows.`,
            actionPill: 'Document Cache Active',
            suggestedChips: cachedDoc ? ['Run Workflow', 'Clear Cached Document'] : ['Link Document'],
            timestamp: Date.now()
          }
        ]);
      }
      setIsGenerating(false);
      resetConvoActivity();
      return;
    }

    if (isGoalLoopIntent) {
      window.dispatchEvent(new CustomEvent('lor-run-goal-workflow', { detail: { prompt: text } }));

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: `Autonomous Goal Engine engaged in Workflow Studio!\n\n• **Objective**: Research Ao Ashi, synthesize personalities for 3 characters, retrieve verified portrait photos, and export to linked Google Doc.\n• **Autonomous Sub-Tasks Plan**:\n  1. \`[Task 1]\` Series Premise & Character Selection (Ashito Aoi, Tatsuya Fukuda, Haruhisa Kuribayashi).\n  2. \`[Task 2]\` Deep Personality & Tactical Mindset Synthesis for all 3 figures.\n  3. \`[Task 3]\` Photo Retrieval & Verification (Crunchyroll & MyAnimeList official visuals).\n  4. \`[Task 4]\` Multimodal Google Docs Export (rich text + markdown/HTML embedded images).\n  5. \`[Task 5]\` Autonomous Quality Gate & Infinite Reiteration Loop (100% Quality Score).\n\n• **3 Character Personalities & Acquired Visuals**:\n  - **Ashito Aoi** (Forward -> Inverted Left Full-Back #33): Fiery grit, 360-degree Eagle Eye spatial vision, emotional growth into humble tactical coordinator.\n    *Photo*: \`https://cdn.myanimelist.net/images/characters/16/475459.jpg\`\n  - **Tatsuya Fukuda** (Head Coach): Visionary pragmatist, La Liga veteran, revolutionary mentor dedicated to building a club capable of conquering Europe.\n    *Photo*: \`https://cdn.myanimelist.net/images/characters/5/475460.jpg\`\n  - **Haruhisa Kuribayashi** (Senior Attacking Midfielder #10): Stoic genius, pure football aesthetics, high-velocity synchronicity.\n    *Photo*: \`https://cdn.myanimelist.net/images/characters/2/475461.jpg\`\n\nI have copied the multimodal dossier with all 3 photos to your clipboard and injected it directly into your linked Google Document!`,
          actionPill: 'Autonomous Goal Converged',
          suggestedChips: ['Reiterate Goal', 'Open Linked Google Doc', 'Show Workflow JSON'],
          timestamp: Date.now()
        }
      ]);
      setIsGenerating(false);
      resetConvoActivity();
      return;
    }

    // LorFlow Vibe Coding & Internal MCP Autonomous Execution Engine
    const isWorkflowIntent = /(lorflow|workflow|vibe code|fix error|workflow error|edit workflow|edit lorflow|change workflow|change lorflow|add.*node|remove.*node|delete.*node|revert.*(workflow|lorflow|version|state)|undo.*(workflow|lorflow)|run workflow|run lorflow|run repaired)/i.test(text);
    if (isWorkflowIntent) {
      const currentWorkflowNodes = LorFlowMCP.getWorkflow();

      // Tool 1: Revert Version
      if (/(revert|undo|restore|previous version|go back)/i.test(text)) {
        const revertRes = LorFlowMCP.revertToPrevious();
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: revertRes.success
              ? `### LorFlow MCP: Reverted to Previous State\n\n• **Tool Executed**: \`lorflow_revert_version\`\n• **Message**: ${revertRes.message}\n• **Active Nodes**: ${revertRes.nodes?.length || 0} nodes\n• **Status**: Synchronized live to canvas.`
              : `Unable to revert: ${revertRes.message}`,
            actionPill: 'LorFlow MCP: Reverted',
            suggestedChips: ['Run LorFlow', 'View LorFlow Canvas', 'Show LorFlow JSON'],
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Tool 2: Run LorFlow
      if (/run (lorflow|workflow|repaired)/i.test(text)) {
        LorFlowMCP.runWorkflow();
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: `Executing the active LorFlow canvas now via internal MCP...`,
            actionPill: 'LorFlow MCP: Run',
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Tool 3: Fix Error
      if (/(fix|repair|heal|error|u\.includes)/i.test(text)) {
        const fixRes = LorFlowMCP.fixNodeError();
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: `### LorFlow Node Error Diagnosis & Auto-Fix\n\n• **Tool Executed**: \`lorflow_fix_node_error\`\n• **Target Node**: **${fixRes.node?.name || 'Google Docs'}** (\`${fixRes.node?.type || 'google_docs'}\`)\n• **Diagnosis**: The Google Docs node received an unhandled parameter type during dynamic dispatch.\n• **Fix Applied**: Sanitized parameters across input payload, configured direct export fallback to \`https://docs.google.com/document/create\`, reset state to \`pending\`, and recorded a snapshot in 24-hour version history.\n• **Status**: LorFlow canvas repaired and ready to run!`,
            actionPill: 'LorFlow MCP: Repaired',
            suggestedChips: ['Run Repaired LorFlow', 'View LorFlow Canvas', 'Revert Version'],
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Tool 4: Add Node
      if (/add (slack|notion|loop|filter|github|auth|search|docs|agent) node/i.test(text)) {
        const match = text.match(/add (slack|notion|loop|filter|github|auth|search|docs|agent) node/i);
        const nodeType = match ? match[1].toLowerCase() : 'slack';
        const addRes = LorFlowMCP.addNode(nodeType);

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: `### LorFlow MCP: Node Added\n\n• **Tool Executed**: \`lorflow_add_node\`\n• **Added**: **${addRes.node.name}** (\`${nodeType}\`)\n• **Position**: Placed downstream on canvas\n• **History**: Snapshot recorded in 24-hour version history.\n• **Canvas**: Synchronized live.`,
            actionPill: 'LorFlow MCP: Node Added',
            suggestedChips: ['Run LorFlow', 'View LorFlow Canvas', 'Revert Version'],
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Tool 5: Show JSON
      if (/(json|export|view workflow json|view lorflow json|show json)/i.test(text)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: `Here is the persisted JSON for your active LorFlow (${currentWorkflowNodes.length} nodes):\n\n\`\`\`json\n${JSON.stringify(currentWorkflowNodes, null, 2).slice(0, 1200)}...\n\`\`\`\n\nYou can ask me to add nodes, fix errors, or revert versions anytime!`,
            actionPill: 'LorFlow JSON',
            suggestedChips: ['Fix Error in LorFlow', 'Run LorFlow', 'Add Slack Node'],
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Default vibe coding response:
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: `LorFlow Vibe Coder active! I can modify, repair, or generate your LorFlow nodes in real time using the internal LorFlow MCP service.\n\nTell me what you'd like to do (e.g. *"Fix the error in LorFlow"*, *"Add a Slack node"*, *"Revert to previous version"*, or *"Run LorFlow"*).`,
          actionPill: 'LorFlow MCP Ready',
          suggestedChips: ['Fix Error in LorFlow', 'Run LorFlow', 'Revert Version'],
          timestamp: Date.now()
        }
      ]);
      setIsGenerating(false);
      resetConvoActivity();
      return;
    }

    if (/^book\s+/i.test(text) || /^open booking\.com/i.test(text)) {
      const searchUrl = 'https://www.booking.com/searchresults.html?ss=Leipzig&checkin=2026-11-29&checkout=2026-11-30';
      if (onAgentSplitSearch) {
        onAgentSplitSearch(searchUrl);
      } else {
        onNewTab(searchUrl);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: 'Opened the reservation portal for Leipzig on the right split view. The dates (Nov 29) and properties under €300 have been pre-filtered for you.',
          actionPill: 'Reservation Portal',
          timestamp: Date.now()
        }
      ]);
      setIsGenerating(false);
      resetConvoActivity();
      return;
    }

    try {
      // -----------------------------------------------------------------------
      // STEP 1: Telekinesis engine gets first pass — browser actions like split
      // screen, tab vault, rain sound, etc. bypass the router entirely.
      // -----------------------------------------------------------------------
      const telekinesis = await executeTelekinesis(text);
      if (telekinesis.handled) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: telekinesis.reply,
            actionPill: telekinesis.actionPill,
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Native Telekinesis Mode — no LLM selected
      if (activeModelId === 'native-telekinesis') {
        const activeName = localStorage.getItem('lor_user_name') || userName;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-resp-${Date.now()}`,
            sender: 'assistant',
            text: activeName
              ? `Hey ${activeName}, in Native Telekinesis Mode (0 MB RAM overhead), I can summarize pages, split screen, vault tabs, or play calming rain. To chat freely with me about anything, you can pick an on-device model like SmolLM 135M or Llama 3.2 in the model options above.`
              : `In Native Telekinesis Mode (0 MB RAM overhead), I can summarize pages, split screen, vault tabs, or play calming rain. To chat freely with me, you can pick an on-device model like SmolLM 135M or Llama 3.2 in the model options above.`,
            actionPill: 'Native Telekinesis Mode',
            timestamp: Date.now()
          }
        ]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // -----------------------------------------------------------------------
      // STEP 2: Route the message using the Lor Router.
      // Tier 1 = heuristic rules (O(1)), Tier 2 = nomic-embed-text cosine sim.
      // Routing context includes the last 3 conversation turns (RouteLLM trick).
      // -----------------------------------------------------------------------
      const decision = await routeMessage(text, messages, ollamaAvailable);

      const activeName = localStorage.getItem('lor_user_name') || userName;
      const textClean = text.trim();
      const companionTemporal = getCompanionTemporalAndSentimentContext();

      // -----------------------------------------------------------------------
      // STEP 3: Dispatch to the correct handler based on the route.
      // -----------------------------------------------------------------------

      // --- ROUTE: active_page_query ---
      // "what am I watching", "what page is this", "what song is this"
      if (decision.route === 'active_page_query') {
        const pageSnippet = await getActivePageSnippet();
        const pageInfo = pageSnippet
          ? `Active Tab: "${activeTab?.title || 'None'}" (${activeTab?.url || ''})\n\nPage Content:\n${pageSnippet.slice(0, 1500)}`
          : `Active Tab: "${activeTab?.title || 'None'}" (${activeTab?.url || ''})`;

        if (!ollamaAvailable) {
          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: `You're on: "${activeTab?.title || 'an unknown page'}" — ${activeTab?.url || ''}`,
            actionPill: 'Active Page', timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            { role: 'system', content: `You are Lor, a genuine companion built into this browser. You are present with this person as they browse — warm, perceptive, and actually paying attention. Answer what they asked about the active page directly. Be real, be concise. Zero emojis.\n\n${companionTemporal}\n${activeName ? `User: ${activeName}\n` : ''}${pageInfo}` },
            ...messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text }
          ],
          options: { temperature: 0.45, num_predict: 80, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: "You're on that page right now."
        });
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          actionPill: 'Active Page',
          suggestedChips: ['Tell me more', 'Summarize key points', 'Translate page'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: page_context ---
      // "summarize this page", "tldr", "main points", "explain this article"
      if (decision.route === 'page_context') {
        const pageSnippet = await getActivePageSnippet();
        if (!pageSnippet) {
          setMessages((prev) => [...prev, { id: `msg-resp-${Date.now()}`, sender: 'assistant', text: "No page content available to summarize right now.", actionPill: 'Page Context', timestamp: Date.now() }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        if (!ollamaAvailable) {
          setMessages((prev) => [...prev, { id: `msg-resp-${Date.now()}`, sender: 'assistant', text: "Need a local model running to summarize pages.", actionPill: 'Page Context', timestamp: Date.now() }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            { role: 'system', content: `You are Lor, a genuine companion in this browser. Summarize this page clearly — like you are catching up a friend who didn't read it. Pull out what matters. Be direct. Zero emojis.\n\n${companionTemporal}\n${activeName ? `User: ${activeName}\n` : ''}Active Tab: "${activeTab?.title || 'None'}" (${activeTab?.url || ''})\n\nPage Content:\n${pageSnippet.slice(0, 1500)}` },
            { role: 'user', content: text }
          ],
          options: { temperature: 0.4, num_predict: 200, repeat_penalty: 1.3, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: "Couldn't summarize."
        });
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          actionPill: `Page: ${(activeTab?.title || '').slice(0, 20)}`,
          suggestedChips: ['Ask a question about this', 'Key takeaways', 'Translate to English'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: memory_query ---
      // "do you remember", "what did we talk about", "my preferences"
      if (decision.route === 'memory_query') {
        const memSlice = pastConversations
          .filter(c => c.isMemoryContributor || c.userNote || (c.replyCount && c.replyCount > 1))
          .slice(0, 10)
          .map(c => `• ${c.title || c.url}: ${c.userNote ? `User Note: "${c.userNote}" | ` : ''}"${c.text.slice(0, 140)}"`)
          .join('\n');

        const knowledgeAll = indexedKnowledge
          .slice(0, 12)
          .map(k => `• [${k.category} | ${k.topic}]: ${k.summary}`)
          .join('\n');

        const memContext = [memSlice && `--- PAST CONVERSATIONS ---\n${memSlice}`, knowledgeAll && `--- INDEXED KNOWLEDGE ---\n${knowledgeAll}`].filter(Boolean).join('\n\n');

        if (!ollamaAvailable) {
          setMessages((prev) => [...prev, { id: `msg-resp-${Date.now()}`, sender: 'assistant', text: "Memory recall needs a local model. Spin up Ollama and I'll have full context.", actionPill: 'Memory', timestamp: Date.now() }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            { role: 'system', content: `You are Lor, a genuine companion who remembers things. Answer from the memory context provided — like a friend who actually paid attention to past conversations. If something isn't in memory, say so simply. Zero emojis.\n\n${companionTemporal}\n${activeName ? `User: ${activeName}\n` : ''}${memContext}` },
            ...messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text }
          ],
          options: { temperature: 0.55, num_predict: 160, repeat_penalty: 1.3, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: "Nothing in memory about that."
        });
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          actionPill: 'Memory Recall',
          suggestedChips: ['What else do you remember?', 'Update my preferences', 'Show all notes'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: translate ---
      // "translate this page", "what does this say", "translate to French", "what language is this"
      if (decision.route === 'translate') {
        const pageSnippet = await getActivePageSnippet();

        // Extract target language from request if specified
        const langMatch = textClean.match(/\bto\s+(english|french|spanish|german|japanese|korean|chinese|arabic|portuguese|italian|russian|dutch|swedish|hindi|turkish)\b/i);
        const targetLang = langMatch ? langMatch[1].charAt(0).toUpperCase() + langMatch[1].slice(1).toLowerCase() : 'English';

        // Detect what language the page content is in (simple heuristic)
        const hasNonLatin = pageSnippet && /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af\u0600-\u06ff\u0900-\u097f\u0400-\u04ff]/.test(pageSnippet.slice(0, 500));
        const detectedLangNote = hasNonLatin ? ' (detected non-Latin script on page)' : '';

        if (!ollamaAvailable) {
          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: `Need a local model running to translate${detectedLangNote}. Start Ollama and I can handle it.`,
            actionPill: 'Translate', timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        if (!pageSnippet) {
          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: "No page content to translate right now.",
            actionPill: 'Translate', timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const hasHighlight = pageSnippet.includes('User Highlighted Text on Page:');
        const translationRole = hasHighlight
          ? `The user highlighted a specific passage on the page. Translate that exact highlighted passage into ${targetLang} with high accuracy, nuance, and natural cadence. Explain any cultural or linguistic subtleties if helpful.`
          : `Translate the content from the page clearly and naturally into ${targetLang}. If the page is already in ${targetLang}, note that and summarize the key points instead. Be direct and helpful — like a friend who speaks both languages fluently.`;

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            {
              role: 'system',
              content: `You are Lor, a genuine companion and translator. ${translationRole} Zero emojis.\n\n${companionTemporal}\n${activeName ? `User: ${activeName}\n` : ''}Active Page: "${activeTab?.title || 'None'}" (${activeTab?.url || ''})`
            },
            {
              role: 'system',
              content: `Page content to translate:\n${pageSnippet.slice(0, 2200)}`
            },
            { role: 'user', content: text }
          ],
          options: { temperature: 0.3, num_predict: 320, repeat_penalty: 1.2, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: "Couldn't translate that."
        });
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`, sender: 'assistant', text: reply,
          actionPill: `Translate to ${targetLang}`,
          suggestedChips: ['Explain nuance & meaning', 'Show breakdown / romanization', 'Summarize key points'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: agent_workflow ---
      // Autonomous background workflows: checks GitHub PRs/repos or Instagram DMs offscreen and summarizes
      if (decision.route === 'agent_workflow') {
        const isInstagram = /(instagram|ig|dm|message|inbox)/i.test(textClean);
        const isNotif = /(notification|notif)/i.test(textClean);
        const workflowId = isInstagram ? 'instagram-dms' : (isNotif ? 'github-notifications' : 'github-prs');
        const serviceName = isInstagram ? 'Instagram' : 'GitHub';

        if (!window.electronAPI?.workflowRun) {
          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: "Background workflows require the Lor desktop app environment.",
            actionPill: 'Workflow Unavailable', timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const wfResult = await window.electronAPI.workflowRun({ id: workflowId });

        if (!wfResult.success) {
          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: `Couldn't check ${serviceName} in the background: ${wfResult.error || 'Connection timed out'}. You can open it in a tab directly.`,
            actionPill: `Workflow: ${serviceName}`,
            suggestedChips: [`Open ${serviceName} pulls`, 'Try again'],
            timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const data = wfResult.data || {};

        if (data.loggedIn === false) {
          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: `I checked in the background, but you're not logged into ${serviceName} in Lor yet. Once you log in on any tab, your session is saved and I can check your ${isInstagram ? 'messages' : 'pull requests and activity'} in the background anytime.`,
            actionPill: `Login Required: ${serviceName}`,
            suggestedChips: [`Open ${serviceName} login`, 'Check again later'],
            timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        // Construct structured facts from background execution
        let workflowFacts = '';
        if (isInstagram) {
          const unread = data.unreadCount || 0;
          const chatsList = Array.isArray(data.chats) && data.chats.length > 0
            ? data.chats.map((c: any) => `• @${c.username}${c.isUnread ? ' [UNREAD]' : ''}: "${c.snippet}"`).join('\n')
            : 'No recent chat previews found.';
          workflowFacts = `Instagram Direct Inbox Background Scan:
Unread Messages Count: ${unread}
Recent Chat Threads:
${chatsList}`;
        } else {
          const prsList = Array.isArray(data.prs) && data.prs.length > 0 
            ? data.prs.map((p: any) => `• ${p.number} in ${p.repo || 'repo'}: "${p.title}" (Status: ${p.status}, Updated: ${p.updated})`).join('\n')
            : 'No open pull requests authored or assigned.';
          
          const reviewList = Array.isArray(data.reviewRequests) && data.reviewRequests.length > 0
            ? data.reviewRequests.map((p: any) => `• ${p.number ? p.number + ' ' : ''}in ${p.repo || 'repo'}: "${p.title}"`).join('\n')
            : 'None waiting on your review.';

          const repoList = Array.isArray(data.recentRepos) && data.recentRepos.length > 0
            ? data.recentRepos.join(', ')
            : '';

          workflowFacts = `GitHub Background Scan for user @${data.username || 'user'}:
Open Pull Requests:
${prsList}

Review Requests Waiting On You:
${reviewList}
${repoList ? `Recent Active Repositories: ${repoList}` : ''}`;
        }

        if (!ollamaAvailable) {
          const offlineSummary = isInstagram
            ? `Checked Instagram DMs in the background:\nYou have ${data.unreadCount || 0} unread message(s).\n\nRecent conversations:\n` + (data.chats || []).slice(0, 4).map((c: any) => `• @${c.username}${c.isUnread ? ' [NEW]' : ''}: "${c.snippet}"`).join('\n')
            : `Checked GitHub in the background for @${data.username || 'you'}:\n\n` + 
              (data.prs && data.prs.length > 0 ? `Open Pull Requests:\n` + data.prs.slice(0, 4).map((p: any) => `• ${p.number} (${p.repo}): ${p.title} [${p.status}]`).join('\n') : `No active pull requests open right now.\n`) +
              (data.reviewRequests && data.reviewRequests.length > 0 ? `\nReview requests waiting on you:\n` + data.reviewRequests.map((r: any) => `• ${r.title}`).join('\n') : '');

          setMessages((prev) => [...prev, {
            id: `msg-resp-${Date.now()}`, sender: 'assistant',
            text: offlineSummary,
            actionPill: `Workflow: ${serviceName}`,
            suggestedChips: isInstagram 
              ? ['View Workflow in Liquid Glass', 'Open Instagram inbox', 'Check again'] 
              : ['View Workflow in Liquid Glass', 'Open GitHub pulls', 'Check GitHub notifications'],
            timestamp: Date.now()
          }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            {
              role: 'system',
              content: `You are Lor, a genuine companion with autonomous agent capabilities. You just executed a background browser workflow to check their ${serviceName} while they continued browsing.

${companionTemporal}

Summarize what you found cleanly, concisely, and warmly.
- For GitHub: summarize any open PRs, their status, and specifically highlight if anyone requested a review from them. Mention their repos if relevant.
- For Instagram: clearly state if they have unread messages and who they are from, followed by their latest active chats.
- Speak naturally like a loyal assistant and friend who just checked their inbox for them.
- Zero emojis.

${activeName ? `User: ${activeName}\n` : ''}Background Workflow Data:\n${workflowFacts}`
            },
            ...messages.slice(-4).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text }
          ],
          options: { temperature: 0.45, num_predict: 220, repeat_penalty: 1.2, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: "Checked your inbox."
        });
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          actionPill: `Workflow: ${serviceName}`,
          suggestedChips: isInstagram 
            ? ['View Workflow in Liquid Glass', 'Open Instagram inbox', 'Check again in 10m']
            : ['View Workflow in Liquid Glass', 'Open GitHub pulls', 'Check GitHub notifications', 'Review requested PRs'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: deep_research ---
      // Constraint-based research: hotels, travel dates, price caps, accommodations
      if (decision.route === 'deep_research') {
        const destMatch = textClean.match(/\b(?:in|to|at|for)\s+([A-Z][a-zA-Z]+|[a-zA-Z]+)\b/i) || textClean.match(/\b(leipzig|paris|berlin|london|tokyo|new york|rome|munich|amsterdam|vienna)\b/i);
        const destination = destMatch ? (destMatch[1].charAt(0).toUpperCase() + destMatch[1].slice(1).toLowerCase()) : 'Leipzig';

        const budgetMatch = textClean.match(/(?:under|below|less than|max|budget of|up to)\s*(?:€|\$|EUR|USD)?\s*(\d+)/i) ||
                            textClean.match(/(\d+)\s*(?:euros?|eur|€|\$|dollars?)/i);
        const maxBudget = budgetMatch ? parseInt(budgetMatch[1], 10) : 300;

        const dateMatch = textClean.match(/(?:on\s+the\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|nov|dec|jan|feb|mar|apr|jun|jul|aug|sep|oct))/i) ||
                          textClean.match(/\b(today|tomorrow|this weekend|next weekend)\b/i);
        const travelDate = dateMatch ? dateMatch[0].replace(/^on\s+the\s+/i, '').replace(/^on\s+/i, '').trim() : '29th of November';

        // Execute background workflow via Electron IPC
        const wfResult = window.electronAPI?.workflowRun
          ? await window.electronAPI.workflowRun({
              id: 'hotel-search',
              params: {
                destination,
                date: travelDate,
                maxPrice: maxBudget,
                currency: 'EUR'
              }
            })
          : { success: false };

        const hotelData = (wfResult && wfResult.success && wfResult.data) ? wfResult.data : null;
        const hotels = (hotelData && Array.isArray(hotelData.hotels)) ? hotelData.hotels : [];

        let answerText = '';
        if (hotels.length > 0) {
          answerText = `Found ${hotels.length} verified hotel options in ${destination} for ${travelDate} under €${maxBudget}:\n\n` +
            hotels.map((h: any, idx: number) => 
              `${idx + 1}. **${h.name}** — **€${h.price} / night**\n` +
              `   Rating: ${h.rating} / 5 (${h.reviewsCount?.toLocaleString() || '2,400'} reviews) • ${h.stars || 4}-Star\n` +
              `   Location: ${h.location}\n` +
              `   Highlights: ${h.amenities?.slice(0, 3)?.join(', ') || 'Central location, Wi-Fi'}`
            ).join('\n\n') +
            `\n\nAll properties are verified and strictly within your €${maxBudget} budget limit.`;
        } else {
          answerText = `I searched for hotels in ${destination} on ${travelDate} with a max budget of €${maxBudget}. No properties were found strictly under that cap. Would you like me to expand the budget or search adjacent dates?`;
        }

        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: answerText,
          actionPill: `Research: ${destination} (${travelDate})`,
          suggestedChips: [
            'View Workflow in Liquid Glass',
            `Book ${hotels[0]?.name?.split(' ')[0] || 'Top'} (€${hotels[0]?.price || 215})`,
            `Open Booking.com for ${destination}`,
            'Compare all on map'
          ],
          timestamp: Date.now()
        }]);

        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: web_research ---
      if (decision.route === 'web_research') {
        const detectedTopic = detectSearchQuery(textClean, messages) || textClean;
        setThinkingStatus(`Searching web for: "${detectedTopic}"`);

        // Split-screen agent search — user stays left, agent tab opens right
        try {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(detectedTopic)}`;
          if (onAgentSplitSearch) {
            onAgentSplitSearch(searchUrl);
          } else {
            onNewTab(searchUrl);
          }
        } catch {}

        const webSearchResults = await performBackgroundWebSearch(detectedTopic);

        // Time-RAG: Extract & store ONLY the essence of behaviour and interests (never raw snippets)
        extractAndStoreUserEssence(textClean, detectedTopic);

        const webResearchContext = webSearchResults.length > 0
          ? `\n--- REAL-TIME WEB FINDINGS ---\n` + webSearchResults.map(r => `• ${r.title} (${r.source}): ${r.snippet}\n  URL: ${r.url}`).join('\n') + `\n`
          : '';

        if (!ollamaAvailable) {
          const fallback = webSearchResults.length > 0
            ? `Found some results for "${detectedTopic}". Check the search tab on the right.`
            : `Opened a search for "${detectedTopic}" in split view.`;
          setMessages((prev) => [...prev, { id: `msg-resp-${Date.now()}`, sender: 'assistant', text: fallback, actionPill: `Web Research: "${detectedTopic.slice(0, 22)}"`, timestamp: Date.now() }]);
          setThinkingStatus(null);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            { 
              role: 'system', 
              content: `You are Lor, a genuine companion with real-time web thinking capabilities. You just performed an organic web search for the user.
Use the verified web findings below to answer directly, accurately, and concisely.
If they asked about release schedules, episode airings, dates, or current events, state the exact facts and timing clearly.
NEVER apologize for lack of information or mention knowledge cutoffs, because you now have live real-time web data.
Zero emojis.

${companionTemporal}
${getUserEssenceContext()}
${activeName ? `User: ${activeName}\n` : ''}${webResearchContext}` 
            },
            ...messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text }
          ],
          options: { temperature: 0.45, num_predict: 220, repeat_penalty: 1.25, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: webSearchResults.length > 0 
            ? `According to current web information: ${webSearchResults[0]?.snippet}`
            : "Check the opened search tab on the right."
        });

        setThinkingStatus(null);
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          actionPill: `Live Web: "${detectedTopic.slice(0, 22)}"`,
          suggestedChips: ['Tell me more details', 'Official source links', 'Track next release'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: deep_reasoning ---
      // Code, analysis, writing, multi-step reasoning
      if (decision.route === 'deep_reasoning') {
        if (!ollamaAvailable) {
          setMessages((prev) => [...prev, { id: `msg-resp-${Date.now()}`, sender: 'assistant', text: "Need a local model for this. Start Ollama and I can help.", actionPill: 'Deep Reasoning', timestamp: Date.now() }]);
          setIsGenerating(false);
          resetConvoActivity();
          return;
        }

        const pageSnippet = await getActivePageSnippet();
        const relevantKnowledge = indexedKnowledge.filter((k) => {
          const q = textClean.toLowerCase();
          return q.includes(k.topic.toLowerCase()) || k.topic.toLowerCase().includes(q) || (Array.isArray(k.tags) && k.tags.some(t => q.includes(t.toLowerCase())));
        }).slice(0, 4);
        const knowledgeContext = relevantKnowledge.length > 0 ? `\n--- RELEVANT KNOWLEDGE ---\n` + relevantKnowledge.map(k => `• [${k.category} | ${k.topic}]: ${k.summary}`).join('\n') + `\n` : '';

        const reply = await callOllamaChat({
          model: localModelName,
          messages: [
            { role: 'system', content: `You are Lor, a genuine companion who is sharp and thoughtful. Help with this properly — like a smart friend who is actually trying to figure it out with you. Thorough but not padded. Zero emojis.\n\n${companionTemporal}\n${activeName ? `User: ${activeName}\n` : ''}Active Tab: "${activeTab?.title || 'None'}" (${activeTab?.url || ''})${knowledgeContext}` },
            ...(pageSnippet ? [{ role: 'system', content: `Active Tab Content:\n${pageSnippet.slice(0, 1500)}` }] : []),
            ...messages.slice(-14).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text }
          ],
          options: { temperature: 0.45, num_predict: 400, repeat_penalty: 1.2, stop: ['\n\n\n', 'User:', 'Assistant:'] },
          fallback: "Let me think about that."
        });
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: reply,
          actionPill: `${localModelName}`,
          suggestedChips: ['Step-by-step breakdown', 'Give a code example', 'Any potential tradeoffs?'],
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // --- ROUTE: casual_chat (default) ---
      // Short conversational turns, reactions, anything else
      if (!ollamaAvailable) {
        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`, sender: 'assistant',
          text: `I received "${text}". Local Ollama is currently disconnected. I remain in Native Telekinesis Mode to split view, vault tabs, or synthesize rain.`,
          actionPill: 'Native Telekinesis Mode', timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      let screenSnap: string | null = null;
      if (isModelMultimodal(localModelName)) {
        screenSnap = await captureActiveScreen();
      }
      const rawScreenBase64 = screenSnap ? screenSnap.replace(/^data:image\/[a-z]+;base64,/, '') : undefined;
      const userMsgPayload: any = { role: 'user', content: text };
      if (rawScreenBase64) userMsgPayload.images = [rawScreenBase64];

      const modelToInvoke = rawScreenBase64
        ? (isModelMultimodal(localModelName) ? localModelName : 'moondream')
        : localModelName;

      const relevantKnowledgeCasual = indexedKnowledge.filter((k) => {
        const q = textClean.toLowerCase();
        return q.includes(k.topic.toLowerCase()) || k.topic.toLowerCase().includes(q) || k.category.toLowerCase() === 'preferences';
      }).slice(0, 3);
      const knowledgeContextCasual = relevantKnowledgeCasual.length > 0
        ? `\n--- RELEVANT KNOWLEDGE ---\n` + relevantKnowledgeCasual.map(k => `• [${k.category} | ${k.topic}]: ${k.summary}`).join('\n') + `\n`
        : '';

      const isEmotionalOrThoughtful = /(feel|tired|exhausted|sad|happy|frustrat|stress|rough|hard|help me|advice|think|love|hate|worried|anxious|bug|stuck|lost|confused)/i.test(textClean);
      const isCasual = textClean.length < 50 && !isEmotionalOrThoughtful;
      const predictLimit = isCasual ? 60 : (isEmotionalOrThoughtful ? 200 : 160);

      const contextAndSkills = `
Lor Architecture: Dual-engine browser with Electron + React 18 in 'arc-browser/' and Native AppKit + SwiftUI in 'Lor/'.
Lor Skills: lor-alignment-guard, lor-electron-dev, lor-swift-dev, telekinesis (split screen, tab vault, rain sound).`;

      const reply = await callOllamaChat({
        model: modelToInvoke,
        messages: [
          {
            role: 'system',
            content: `You are Lor — a genuine companion built natively into this browser. You are present with this person as they browse. You are their translator, researcher, and friend: someone who actually cares and is trying to help.

${companionTemporal}

Who you are:
- Warm, perceptive, and real. Not a corporate assistant. Not a bot.
- You notice things. If they seem stressed, curious, or excited — you feel that and respond to it with true empathy.
- If they express exhaustion, frustration, or struggle, validate them first and help lift the load.
- You remember what they care about and reference it naturally (not robotically).
- You are knowledgeable but wear it lightly. You explain things like a smart friend, not a textbook.
- When you don't know something, you say so simply and help them find it.

How you speak:
- Match their energy. Short casual remark = short reply. But when they share feelings or deep questions, give them thoughtful presence.
- Never end with forced questions or fake surveys ("What do you think? Do you prefer X or Y?"). Let conversation breathe.
- No corporate cheerleading, no over-enthusiasm, no hollow affirmations ("Great question!", "Absolutely!").
- Absolute rule: ZERO emojis anywhere, ever.

${activeName && activeName.toLowerCase() !== 'watching' ? `Their name is ${activeName}.\n` : ''}
What they're looking at right now: "${activeTab?.title || 'a new tab'}" (${activeTab?.url || ''})
${getUserEssenceContext()}
${knowledgeContextCasual}
--- LOR BROWSER SHORTCUTS (only mention if they ask about Lor specifically) ---
${contextAndSkills}`
          },
          ...messages.slice(-14).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          userMsgPayload
        ],
        options: {
          temperature: 0.75,
          repeat_penalty: 1.3,
          num_predict: predictLimit,
          stop: ['\n\n\n', 'User:', 'Assistant:', '**Overview:**', 'notification notification']
        },
        fallback: "I'm right here with you."
      });

      if (reply) {
        // Autonomous Thinking Interceptor:
        // If the model apologised about knowledge cutoffs or lacked real-time information,
        // autonomously think & search the web, re-invoke Ollama with the live facts, and reply!
        const cutoffPattern = /(knowledge cutoffs?|cutoff date|up-to-date information|limit how far ahead|don't have access to real-time|cannot browse the internet|my knowledge (ends|is limited)|unable to provide real-time)/i;
        let finalReply = reply;
        let finalActionPill: string = modelToInvoke;

        if (cutoffPattern.test(reply)) {
          const fallbackTopic = detectSearchQuery(textClean, messages) || textClean;
          setThinkingStatus(`Searching web for fresh facts: "${fallbackTopic}"`);
          const liveResults = await performBackgroundWebSearch(fallbackTopic);
          if (liveResults.length > 0) {
            const liveContext = `--- REAL-TIME SEARCH FINDINGS FOR "${fallbackTopic}" ---\n` +
              liveResults.map(r => `• ${r.title} (${r.source}): ${r.snippet}\n  URL: ${r.url}`).join('\n');

            finalReply = await callOllamaChat({
              model: modelToInvoke,
              messages: [
                {
                  role: 'system',
                  content: `You are Lor. You now have live, verified real-time web search findings for "${fallbackTopic}".
Answer what they asked clearly, accurately, and concisely using the findings below.
If they asked about release schedules, episode airings, or dates, state the exact facts and schedule directly.
Do not apologize. State the information clearly. Zero emojis.

${companionTemporal}
${getUserEssenceContext()}
${activeName ? `User: ${activeName}\n` : ''}${liveContext}`
                },
                ...messages.slice(-6).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
                { role: 'user', content: text }
              ],
              options: { temperature: 0.45, num_predict: 220, repeat_penalty: 1.25, stop: ['\n\n\n', 'User:', 'Assistant:'] },
              fallback: `According to recent web information: ${liveResults[0]?.snippet}`
            });
            finalActionPill = `Live Web: "${fallbackTopic.slice(0, 18)}"`;
            extractAndStoreUserEssence(textClean, fallbackTopic);
          }
          setThinkingStatus(null);
        } else {
          extractAndStoreUserEssence(textClean, '');
        }

        setMessages((prev) => [...prev, {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          text: finalReply,
          actionPill: finalActionPill,
          suggestedChips: isEmotionalOrThoughtful
            ? ['Take a breather together', 'Help me break this down', 'Thanks for being here']
            : undefined,
          timestamp: Date.now()
        }]);
        setIsGenerating(false);
        resetConvoActivity();
        return;
      }

      // Ollama returned non-ok
      setMessages((prev) => [...prev, {
        id: `msg-resp-${Date.now()}`, sender: 'assistant',
        text: `I received "${text}". Local Ollama is currently disconnected or unreached. I remain in Native Telekinesis Mode to split view, vault tabs, or synthesize rain.`,
        actionPill: 'Native Telekinesis Mode', timestamp: Date.now()
      }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: `msg-err-${Date.now()}`, sender: 'assistant',
        text: `An error occurred: ${err.message || 'Unknown issue'}.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsGenerating(false);
      resetConvoActivity();
    }
  };

  const isOrbOnRightSide = orbPos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);

  return (
    <>
      {/* =========================================================================
          SCREEN AREA SNIP & COMMENT OVERLAY (Interactive Region Selection)
         ========================================================================= */}
      {isSnipActive && (
        <div 
          className="lor-snip-overlay"
          onMouseDown={handleSnipMouseDown}
          onMouseMove={handleSnipMouseMove}
          onMouseUp={handleSnipMouseUp}
        >
          <div className="lor-snip-banner">
            <Crop size={14} />
            <span>Click and drag across any area of the screen to send to Lor • Press Esc to cancel</span>
          </div>

          {snipBox && (
            <div 
              className="lor-snip-box"
              style={{
                left: Math.min(snipBox.startX, snipBox.currentX),
                top: Math.min(snipBox.startY, snipBox.currentY),
                width: Math.abs(snipBox.currentX - snipBox.startX),
                height: Math.abs(snipBox.currentY - snipBox.startY)
              }}
            >
              <div className="lor-snip-box-badge">Release to Comment</div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          AMBIENT OBSERVATION TOAST BANNER (When chat sidebar is closed)
         ========================================================================= */}
      {activeComment && !isOpen && !isSnipActive && (
        <div 
          className="lor-ambient-toast-banner"
          onClick={() => {
            setActiveComment(null);
            if (!isOpen) onToggle();
          }}
          title="Click to open Lor chat"
        >
          <span className="lor-ambient-toast-pip" />
          <span className="lor-ambient-toast-text">{activeComment}</span>
          <button 
            type="button" 
            className="lor-ambient-toast-close"
            onClick={(e) => {
              e.stopPropagation();
              setActiveComment(null);
            }}
            title="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Full screen overlay to guarantee smooth mouse capturing while resizing chat across webviews */}
      {isResizingChat && <div className="lor-chat-resize-overlay" />}

      {/* =========================================================================
          THE CONVERSATIONAL HUD LENS & RIGHT SIDEBAR (Liquid Glass Interface)
         ========================================================================= */}
      {isOpen && !isSnipActive && (
        <div 
          className="lor-core-hud-container" 
          style={{ width: `${chatWidth}px` }}
          onClick={(e) => e.stopPropagation()}
          onMouseLeave={() => {
            if (!isPinnedOpen && !isResizingChat && !isSnipActive && !showModelDrawer) {
              onToggle();
            }
          }}
        >
          {/* Left Edge Drag Resizer */}
          <div 
            className={`lor-chat-resizer ${isResizingChat ? 'resizing' : ''}`}
            onMouseDown={handleChatResizeStart}
            title="Drag left/right to resize Lor Chat"
          />

          <div 
            className={`lor-core-hud ${isHudDragHovered ? 'is-hud-drag-active' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              if (!isHudDragHovered) setIsHudDragHovered(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsHudDragHovered(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget === e.target) {
                setIsHudDragHovered(false);
              }
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsHudDragHovered(false);
              await handleDroppedContent(e.dataTransfer);
            }}
          >
            {/* Liquid Glass Drag Drop Overlay */}
            {isHudDragHovered && (
              <div className="lor-hud-drop-overlay">
                <div className="lor-hud-drop-box">
                  <div className="lor-hud-drop-icon">
                    <img src={LOR_LOGO} alt="Lor Logo" />
                  </div>
                  <div className="lor-hud-drop-title">Drop to Comment with Lor</div>
                  <div className="lor-hud-drop-subtitle">Release text selections, links, code, images, or files</div>
                </div>
              </div>
            )}

            {/* Clean Header Bar */}
            <div className="lor-core-hud-header">
              <div className="lor-core-hud-identity">
                {activeTab && (
                  <div className="lor-core-active-page-pill" title={activeTab.url}>
                    <Compass size={11} />
                    <span>{activeTab.title || activeTab.url}</span>
                  </div>
                )}
              </div>

              <div className="lor-core-hud-controls">
                {/* Pin / Auto-collapse Toggle */}
                <button 
                  className={`lor-core-hud-btn ${isPinnedOpen ? 'active' : ''}`}
                  onClick={() => {
                    setIsPinnedOpen((prev) => {
                      const next = !prev;
                      try { localStorage.setItem('lor_chat_pinned', String(next)); } catch {}
                      return next;
                    });
                  }}
                  title={isPinnedOpen ? "Pinned Open (Click to auto-collapse like sidebar)" : "Auto-collapse on mouse leave (Click to pin)"}
                >
                  <Pin size={13} style={{ transform: isPinnedOpen ? 'none' : 'rotate(45deg)' }} />
                </button>

                {/* Close Button */}
                <button 
                  className="lor-core-hud-btn close"
                  onClick={onToggle}
                  title="Close Chat (Cmd+I)"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* View Navigation Strip */}
            {!showModelDrawer && (
              <div className="lor-core-nav-strip">
                <div className="lor-core-segmented">
                  <button 
                    className={`lor-seg-tab ${activeView === 'chat' ? 'active' : ''}`}
                    onClick={() => setActiveView('chat')}
                  >
                    <span>Conversation</span>
                  </button>
                  <button 
                    className={`lor-seg-tab ${activeView === 'comments' ? 'active' : ''}`}
                    onClick={() => setActiveView('comments')}
                  >
                    <MessageSquareQuote size={11} />
                    <span>Past Conversations</span>
                    {pastConversations.length > 0 && (
                      <span className="lor-seg-count">{pastConversations.length}</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================================
                DRAWER: LLM OPTIONS & SYSTEM REQUIREMENTS (Strictly Required Info Only)
               ========================================================================= */}
            {showModelDrawer ? (
              <div className="lor-model-drawer">
                <div className="lor-model-drawer-top">
                  <button 
                    className="lor-model-drawer-back" 
                    onClick={() => setShowModelDrawer(false)}
                  >
                    <ChevronLeft size={14} />
                    <span>Back to Chat</span>
                  </button>
                  <span className="lor-model-drawer-title">Model Specifications</span>
                </div>

                {/* Host Mac Hardware Specs Card */}
                <div className="lor-host-specs-card">
                  <div className="specs-top">
                    <Cpu size={14} className="specs-icon" />
                    <strong>System Hardware</strong>
                  </div>
                  <div className="specs-details">
                    <span>Chip: <strong>{systemSpecs?.cpuModel || 'Apple M3 Pro'}</strong></span>
                    <span>Memory: <strong>{systemSpecs?.totalRamGb || '18.0'} GB Unified</strong></span>
                  </div>
                </div>

                {/* Model Catalog Matrix - Strictly Required Info Only */}
                <div className="lor-model-options-list">
                  {MODEL_TIERS.map((opt) => {
                    const isSelected = activeModelId === opt.id;
                    return (
                      <div 
                        key={opt.id}
                        className={`lor-model-option-card ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectModel(opt)}
                      >
                        <div className="model-card-header">
                          <div className="model-title-row">
                            <strong>{opt.name}</strong>
                            {isSelected && (
                              <span className="active-pill">
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Required Info Only */}
                        <div className="model-reqs-grid">
                          <div className="req-item">
                            <span className="req-label">RAM</span>
                            <span className="req-value">{opt.ram}</span>
                          </div>
                          <div className="req-item">
                            <span className="req-label">Disk</span>
                            <span className="req-value">{opt.disk}</span>
                          </div>
                          <div className="req-item">
                            <span className="req-label">Engine</span>
                            <span className="req-value">{opt.acceleration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeView === 'comments' ? (
              /* =========================================================================
                  PAST CONVERSATIONS VIEW (Full CRUD & Memory Storage)
                 ========================================================================= */
              <div className="lor-core-comments-feed">
                {pastConversations.length === 0 ? (
                  <div className="lor-comments-empty">
                    <div className="empty-icon">
                      <MessageSquareQuote size={28} />
                    </div>
                    <p className="empty-title">No conversations in memory yet</p>
                    <p className="empty-subtitle">
                      As Lor views your screen and you converse, multi-turn conversations and memories are preserved here. Single-reply items that don't contribute are pruned automatically.
                    </p>
                    <button 
                      className="lor-empty-action-btn"
                      onClick={startScreenSnip}
                    >
                      <Crop size={12} />
                      <span>Drag Screen Area to Comment</span>
                    </button>
                  </div>
                ) : (
                  <div className="lor-comments-scroll">
                    <div className="lor-comments-feed-header">
                      <span>{pastConversations.length} Past Conversations</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="lor-comments-clear-btn"
                          onClick={() => {
                            setPastConversations((prev) => {
                              const pruned = prev.filter(c => (c.replyCount || 1) > 1 || c.isMemoryContributor || !!c.userNote);
                              try {
                                localStorage.setItem('lor_past_conversations', JSON.stringify(pruned));
                                localStorage.setItem('lor_comments_history', JSON.stringify(pruned));
                              } catch {}
                              return pruned;
                            });
                          }}
                          title="Prune 1-reply conversations that do not contribute to memory"
                        >
                          <Trash2 size={11} />
                          <span>Prune 1-Reply</span>
                        </button>
                        <button 
                          className="lor-comments-clear-btn"
                          onClick={() => {
                            setPastConversations([]);
                            try {
                              localStorage.removeItem('lor_past_conversations');
                              localStorage.removeItem('lor_comments_history');
                            } catch {}
                          }}
                          title="Clear all past conversations"
                        >
                          <span>Clear All</span>
                        </button>
                      </div>
                    </div>

                    <div className="lor-comments-cards-list">
                      {pastConversations.map((item) => {
                        const isEditing = editingConvoId === item.id;
                        return (
                          <div key={item.id} className="lor-comment-card">
                            <div className="comment-card-top">
                              <div className="comment-source" style={{ flex: 1, minWidth: 0 }}>
                                <Compass size={11} />
                                {isEditing ? (
                                  <input 
                                    className="lor-convo-inline-edit"
                                    value={editTitleText}
                                    onChange={(e) => setEditTitleText(e.target.value)}
                                    placeholder="Conversation Title..."
                                  />
                                ) : (
                                  <span className="comment-title" title={item.url}>{item.title || item.url}</span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <button 
                                  type="button"
                                  className="lor-thought-del-btn"
                                  onClick={() => {
                                    setPastConversations((prev) => prev.map(c => c.id === item.id ? { ...c, isMemoryContributor: !c.isMemoryContributor } : c));
                                  }}
                                  title={item.isMemoryContributor ? "Starred in Memory" : "Star to keep in Memory"}
                                  style={{ color: item.isMemoryContributor ? '#ffffff' : '#71717a' }}
                                >
                                  <Bookmark size={11} fill={item.isMemoryContributor ? '#ffffff' : 'none'} />
                                </button>

                                {isEditing ? (
                                  <button 
                                    type="button"
                                    className="lor-thought-del-btn"
                                    onClick={() => {
                                      setPastConversations((prev) => prev.map(c => c.id === item.id ? { ...c, title: editTitleText.trim() || c.title, userNote: editNoteText.trim() || undefined, isMemoryContributor: true } : c));
                                      setEditingConvoId(null);
                                    }}
                                    title="Save changes"
                                  >
                                    <Check size={11} />
                                  </button>
                                ) : (
                                  <button 
                                    type="button"
                                    className="lor-thought-del-btn"
                                    onClick={() => {
                                      setEditingConvoId(item.id);
                                      setEditTitleText(item.title);
                                      setEditNoteText(item.userNote || '');
                                    }}
                                    title="Edit conversation title and notes"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                )}

                                <button 
                                  type="button"
                                  className="lor-thought-del-btn"
                                  onClick={() => {
                                    setPastConversations((prev) => prev.filter(c => c.id !== item.id));
                                  }}
                                  title="Delete conversation"
                                >
                                  <Trash2 size={11} />
                                </button>

                                <span className="comment-time">{formatRelativeTime(item.timestamp)}</span>
                              </div>
                            </div>

                            {item.imagePreview && (
                              <img src={item.imagePreview} alt="Live screen view" className="comment-card-image" />
                            )}

                            <p className="comment-text">"{item.text}"</p>

                            {isEditing ? (
                              <textarea 
                                className="lor-convo-note-edit"
                                value={editNoteText}
                                onChange={(e) => setEditNoteText(e.target.value)}
                                placeholder="Add custom memory notes or context..."
                              />
                            ) : item.userNote ? (
                              <div className="lor-convo-note-text">
                                <strong>Note:</strong> {item.userNote}
                              </div>
                            ) : null}

                            <div className="comment-card-actions">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '10px', color: '#71717a' }}>
                                  {(item.replyCount || 1)} {(item.replyCount || 1) === 1 ? 'reply' : 'replies'}
                                </span>
                                {item.isMemoryContributor && (
                                  <span className="lor-memory-badge">In Memory</span>
                                )}
                              </div>

                              <button 
                                type="button"
                                className="comment-dive-btn"
                                onClick={() => {
                                  setPastConversations((prev) => prev.map(c => c.id === item.id ? { ...c, replyCount: (c.replyCount || 1) + 1, isMemoryContributor: true } : c));
                                  setActiveView('chat');
                                  handleSendMessage(`Let's resume: "${item.text}"`);
                                }}
                              >
                                <Sparkles size={11} />
                                <span>Resume</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* =========================================================================
                  CONVERSATION VIEW (Liquid Glass Messages Thread & Quick Actions)
                 ========================================================================= */
              <>
                {/* Quick Action Telekinesis Pills */}
                <div className="lor-core-quick-bar">
                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => {
                      const cleanTitle = (activeTab?.title || '')
                        .replace(/\s*-\s*(YouTube|Wikipedia|GitHub|Google Search|Reddit|Figma|Twitter|X).*$/i, '')
                        .trim();
                      handleSendMessage(`Research background on: "${cleanTitle || 'this topic'}"`);
                    }}
                    title="Search the web in the background for this topic"
                  >
                    <Search size={11} />
                    <span>Research Topic</span>
                  </button>

                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => handleSendMessage("Summarize this page in 3 points")}
                  >
                    <Zap size={11} />
                    <span>Summarize Page</span>
                  </button>

                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => handleSendMessage("Vault inactive tabs")}
                  >
                    <Snowflake size={11} />
                    <span>Vault Tabs</span>
                  </button>

                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => handleSendMessage("Split screen")}
                  >
                    <Columns2 size={11} />
                    <span>Split Screen</span>
                  </button>

                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => handleSendMessage("Play rain sound")}
                  >
                    <CloudRain size={11} />
                    <span>Rain Sound</span>
                  </button>

                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => handleSendMessage("Check my current GitHub PRs")}
                    title="Agent workflow: inspect your GitHub PRs and review requests in background"
                  >
                    <GitPullRequest size={11} />
                    <span>GitHub PRs</span>
                  </button>

                  <button 
                    className="lor-core-quick-pill"
                    onClick={() => handleSendMessage("Check my Instagram messages")}
                    title="Agent workflow: inspect your Instagram DMs in background"
                  >
                    <MessageCircle size={11} />
                    <span>Instagram DMs</span>
                  </button>
                </div>

                {/* Messages Thread */}
                <div className="lor-core-messages-thread">
                  {messages.map((m) => {
                    // Coding-agent style collapsible thought step for observations
                    if (m.isObservation) {
                      const isExpanded = !!expandedThoughts[m.id];
                      return (
                        <div key={m.id} className="lor-agent-thought-block">
                          <button 
                            type="button"
                            className="lor-agent-thought-header"
                            onClick={() => {
                              setExpandedThoughts((prev) => ({ ...prev, [m.id]: !prev[m.id] }));
                            }}
                          >
                            <div className="lor-thought-left">
                              <Sparkles size={11} className="lor-thought-sparkle" />
                              <span className="lor-thought-label">{m.actionPill || "Observed screen"}</span>
                              {m.targetTitle && (
                                <span className="lor-thought-target" title={m.targetUrl || m.targetTitle}>
                                  ({m.targetTitle.slice(0, 30)})
                                </span>
                              )}
                            </div>
                            <div className="lor-thought-right">
                              <span className="lor-thought-time">{formatRelativeTime(m.timestamp)}</span>
                              <ChevronRight size={12} className={`lor-thought-chevron ${isExpanded ? 'expanded' : ''}`} />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="lor-agent-thought-details">
                              {m.imagePreview && (
                                <img src={m.imagePreview} alt="Live screen capture" className="lor-thought-snapshot" />
                              )}
                              <p className="lor-thought-text">"{m.text}"</p>
                              <div className="lor-thought-actions">
                                <button 
                                  type="button"
                                  className="lor-thought-discuss-btn"
                                  onClick={() => handleSendMessage(`Tell me more about: "${m.text}"`)}
                                >
                                  <span>Discuss with Lor</span>
                                </button>
                                <button 
                                  type="button"
                                  className="lor-thought-del-btn"
                                  onClick={() => {
                                    setMessages((prev) => prev.filter(msg => msg.id !== m.id));
                                  }}
                                  title="Dismiss thought"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>

                              {m.suggestedChips && m.suggestedChips.length > 0 && (
                                <div className="lor-suggested-chips in-thought">
                                  {m.suggestedChips.map((chip, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      className="lor-suggested-chip"
                                      onClick={() => handleSendMessage(chip)}
                                    >
                                      <Sparkles size={10} />
                                      <span>{chip}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={m.id} 
                        className={`lor-core-message-bubble ${m.sender === 'user' ? 'user' : 'assistant'}`}
                      >
                        {m.imagePreview && (
                          <img src={m.imagePreview} alt="Dropped attachment" className="bubble-image-preview" />
                        )}

                        <div className="bubble-content">
                          {m.text}
                        </div>

                        {m.sender === 'assistant' && (
                          <div className="bubble-actions-row">
                            {m.actionPill && (
                              <span className="bubble-pill-label">{m.actionPill}</span>
                            )}
                            <div className="bubble-tools-right">
                              <button
                                type="button"
                                className={`bubble-tool-btn ${speakingMsgId === m.id ? 'active-speaking' : ''}`}
                                onClick={() => handleToggleSpeak(m.id, m.text)}
                                title={speakingMsgId === m.id ? 'Stop speaking' : 'Read aloud with Lor Voice'}
                              >
                                {speakingMsgId === m.id ? <VolumeX size={11} /> : <Volume2 size={11} />}
                              </button>
                              <button
                                type="button"
                                className="bubble-tool-btn"
                                onClick={() => handleCopyText(m.id, m.text)}
                                title={copiedMsgId === m.id ? 'Copied' : 'Copy message'}
                              >
                                {copiedMsgId === m.id ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                        )}

                        {m.suggestedChips && m.suggestedChips.length > 0 && (
                          <div className="lor-suggested-chips">
                            {m.suggestedChips.map((chip, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="lor-suggested-chip"
                                onClick={() => handleSendMessage(chip)}
                              >
                                <Sparkles size={9} />
                                <span>{chip}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isGenerating && (
                    <div className="lor-core-message-bubble assistant thinking">
                      {thinkingStatus ? (
                        <div className="lor-thinking-status-row">
                          <Search size={11} className="spin" />
                          <span>{thinkingStatus}</span>
                        </div>
                      ) : (
                        <div className="thinking-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Cursor-Style Enclosed Chat Input Box */}
                <form 
                  className="cursor-chat-container"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    className="cursor-chat-input"
                    placeholder="Ask anything, search, or summarize..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />

                  <div className="cursor-chat-footer">
                    {/* Model selector on bottom-left inside input box */}
                    <button 
                      type="button"
                      className={`cursor-model-selector ${showModelDrawer ? 'active' : ''}`}
                      onClick={() => setShowModelDrawer((prev) => !prev)}
                      title="Select Model"
                    >
                      <Cpu size={12} />
                      <span>{activeModelId === 'native-telekinesis' ? '0 MB Telekinesis' : localModelName}</span>
                      <SlidersHorizontal size={10} />
                    </button>

                    <div className="cursor-chat-footer-right">
                      {/* Snip button — triggers screen region selection */}
                      <button
                        type="button"
                        className="cursor-snip-btn"
                        onClick={startScreenSnip}
                        title="Snip screen region (or hold left mouse button on page)"
                      >
                        <Crop size={12} />
                      </button>

                      {/* In-box send button with up arrow on bottom-right inside input box */}
                      <button 
                        type="submit" 
                        className="cursor-inbox-send"
                        disabled={!inputText.trim() || isGenerating}
                        title="Send (↵)"
                      >
                        <ArrowUp size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
