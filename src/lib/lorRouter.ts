/**
 * Lor Router — Context-Aware Conversational Intent Router
 *
 * Architecture draws from:
 *   - RouteLLM (LMSYS/Anyscale, 2024): preference-data-driven routing to
 *     route simple queries to lightweight models and complex queries to
 *     stronger ones. https://arxiv.org/abs/2406.18665
 *
 *   - Anthropic's "Building Effective Agents" (2024): the Classification &
 *     Dispatch workflow pattern — a fast, cheap classifier intercepts each
 *     prompt BEFORE the primary generation model runs, routing to mutually
 *     exclusive specialized handlers. This avoids monolithic agent loops.
 *     https://www.anthropic.com/research/building-effective-agents
 *
 *   - Semantic Router (Aurelio AI, 2024): embedding-based cosine similarity
 *     routing against prototype centroids, giving <5ms routing latency with
 *     no external API calls.
 *
 * How it works in Lor Browser:
 *   1. Build a "routing context" = sliding window of last 3 conversation turns
 *      + the current user message. This is the RouteLLM multi-turn trick —
 *      routing on isolated single-turn queries loses conversational context.
 *
 *   2. Compute a lightweight embedding of that routing context via Ollama's
 *      nomic-embed-text (or fall back to rule-based classification if Ollama
 *      is unavailable).
 *
 *   3. Compare against precomputed centroid embeddings for each route using
 *      cosine similarity.
 *
 *   4. Return the winning route with confidence score. The calling component
 *      dispatches to the right handler: telekinesis, browser action, web
 *      search + split screen, page summarization, or free casual chat.
 */

export type LorRouteId =
  | 'browser_action'    // Tab management, split screen, vault, spaces — handled by Telekinesis engine
  | 'page_context'      // Summarize / explain / read the current page
  | 'web_research'      // Research a topic, entity or question — triggers split-screen agent search
  | 'active_page_query' // "what am I watching", "what's this page about", etc.
  | 'casual_chat'       // Small talk, reactions, short conversational turns
  | 'memory_query'      // "do you remember X", "what did I say about Y"
  | 'translate'         // Translate page content, selected text, or a phrase
  | 'agent_workflow'    // Background automated workflows: checking GitHub PRs/repos, Instagram DMs, etc.
  | 'deep_research'     // Multi-constraint search: hotels, flights, rentals, dates, budget limits
  | 'deep_reasoning';   // Complex multi-step reasoning, code, writing, analysis

export interface RouterDecision {
  route: LorRouteId;
  confidence: number; // 0–1, cosine similarity or heuristic score
  method: 'embedding' | 'heuristic'; // whether we used embeddings or rule-based fallback
  contextSummary?: string; // compressed sliding-window context fed to the router
}

// ---------------------------------------------------------------------------
// Route definitions — each route has a set of prototypical utterances.
// These are averaged into a centroid embedding at runtime.
// Designed as mutually exclusive following Anthropic's routing best practices.
// ---------------------------------------------------------------------------
const ROUTE_PROTOTYPES: Record<LorRouteId, string[]> = {
  browser_action: [
    'split screen with this tab',
    'vault all inactive tabs',
    'freeze my tabs',
    'open split view',
    'switch to work space',
    'close this tab',
    'open a new tab',
    'play rain sounds',
    'turn off ambient sound',
    'search my memory for notes',
    'show tab vault',
  ],
  page_context: [
    'summarize this page',
    'tldr',
    'explain this article',
    'key takeaways from this',
    'what does this page say',
    'give me the gist',
    'extract the main points',
    'what is this article about',
  ],
  web_research: [
    'who is cortis',
    'what is the latest album from twice',
    'weather in berlin today',
    'what happened with openai',
    'tell me about this band',
    'research kpop group stray kids',
    'who is song hye kyo',
    'what year did they debut',
    'find information about',
    'look up taylor swift new album',
    'stock price of apple',
    'release date for',
  ],
  active_page_query: [
    'see what im watching',
    'what am i watching',
    'what video is this',
    'what song is this',
    'what page am i on',
    'who made this',
    'what is this video',
    'tell me about what im looking at',
    'what channel is this',
  ],
  casual_chat: [
    'nothing much',
    'yeah haha',
    'lol true',
    'yeap',
    'hey',
    'ok cool',
    'nice',
    'interesting',
    'i agree',
    'good to know',
    'haha yeah',
    'fair enough',
    'that makes sense',
    'alright',
    'sounds good',
  ],
  memory_query: [
    'do you remember what i said earlier',
    'what did we discuss before this',
    'what did i tell you in our previous chat',
    'what are my saved preferences',
    'what notes did you take about me',
    'check what you remember about me',
    'show me what we talked about previously',
    'from our previous session do you recall my note'
  ],
  translate: [
    'translate this page',
    'what does this say in english',
    'translate this to french',
    'what language is this',
    'translate the selected text',
    'translate this article',
    'what does this mean in spanish',
    'translate to english',
    'can you translate this',
    'this is in japanese what does it say',
    'translate from korean',
    'what does this word mean in german',
  ],
  agent_workflow: [
    'check my github prs',
    'check my github rps',
    'check my pull requests',
    'check my github notifications',
    'check my instagram messages',
    'check my ig dms',
    'check instagram direct messages',
    'do i have any new messages on instagram',
    'check my dms',
    'run workflow to check github',
    'any new pull requests for me',
    'check my github repos',
    'check unread messages on instagram',
  ],
  deep_research: [
    'find a hotel to stay in leipzig on the 29th of november under 300 euros',
    'find a hotel in leipzig under 300 euros',
    'find hotel in paris next weekend under 200',
    'search for flights from berlin to tokyo under 800 euros',
    'find an airbnb in london with high rating',
    'compare hotels in tokyo under budget',
    'research hotels in rome for 3 nights under 150 per night',
    'find cheap accommodation in new york',
  ],
  deep_reasoning: [
    'write a function that does',
    'debug this code',
    'explain the tradeoffs between',
    'help me write an essay on',
    'analyze this situation',
    'compare these two options',
    'draft an email to',
    'design a system that',
    'what are the pros and cons',
    'how would i implement',
    'explain quantum entanglement',
  ],
};

// ---------------------------------------------------------------------------
// Heuristic rule-based fallback router — O(1), no network needed
// Follows Anthropic's guidance: simple deterministic rules for clear cases
// before escalating to expensive ML-based classification.
// ---------------------------------------------------------------------------
function heuristicRoute(currentMessage: string, contextText: string): { route: LorRouteId; confidence: number } | null {
  const currentMsg = currentMessage.toLowerCase().trim();
  const t = currentMsg; // High-priority deterministic rules MUST inspect the current user message!

  // Browser actions — high-confidence regex patterns
  if (/(split( screen)?|side by side|dual view|vault tabs|freeze tabs|rain sound|open new tab|close tab|switch to .* space)\b/i.test(t)) {
    return { route: 'browser_action', confidence: 0.95 };
  }

  // Active page queries
  if (/^(see what i['']?m watching|what am i watching|what video is this|what page am i on|what song is this|what['']s this video)/i.test(t)) {
    return { route: 'active_page_query', confidence: 0.95 };
  }

  // Page summarization requests
  if (/(summarize|tldr|gist|key takeaways|explain this (page|article|post|video)|main points|what does this (page|article) say)/i.test(t)) {
    return { route: 'page_context', confidence: 0.92 };
  }

  // Memory queries: ONLY trigger when user explicitly requests memory/notes/preferences recall
  if (/^(do you remember|remember when|what did (i|we) (say|talk|discuss)|recall (our|my|what)|check (my )?notes|what are my preferences|what do you know about me|show all notes)\b/i.test(t)) {
    return { route: 'memory_query', confidence: 0.95 };
  }

  // Translation requests
  if (/(translat|what (does|do) this (say|mean)|what language is|translate (this|to|from)|in english|in (french|spanish|german|japanese|korean|chinese|arabic|portuguese|italian|russian))/i.test(t)) {
    return { route: 'translate', confidence: 0.93 };
  }

  // Agent background workflows (GitHub PRs / Instagram DMs / Notifications)
  if (/(github.*(pr|pull|repo|rp|notif)|(pr|pull request|rp)s?\b.*github|instagram.*(dm|message|inbox)|(dm|message)s?\b.*(instagram|ig)\b|check (my )?(github|instagram|ig|prs|rps|dms|messages|pull requests)|any (new )?(prs|dms|messages|pull requests))/i.test(t)) {
    return { route: 'agent_workflow', confidence: 0.96 };
  }

  // Deep multi-constraint research (hotels, flights, rentals, travel with dates/budget)
  if (/(hotel|airbnb|hostel|stay in|flight|booking|reservation|room|accommodation)\b.*(under|\$|€|eur|usd|budget|per night|\d+\s*(euro|eur|dollar|\$|€))/i.test(t) ||
      /(find|search|look for|book).*(hotel|hostel|stay in|accommodation|flight|rental)\b/i.test(t)) {
    return { route: 'deep_research', confidence: 0.96 };
  }

  // Explicit or implicit research intent & temporal / release / real-time / factual inquiries
  if (
    /(when (is|was|will|did|does|the next)|coming out|airing|next episode|next season|last comeback|latest comeback|comeback|release date|schedule|air date|broadcast date|latest episode|last album|discography)\b/i.test(t) ||
    /(who is|who was|what is|what was|tell me about|research|find info|look up|when did|when was|where is|how does|weather|forecast|stock price|latest news|current status)/i.test(t)
  ) {
    return { route: 'web_research', confidence: 0.94 };
  }

  // Follow-up entity corrections or continuations (e.g. "i mean fx", "no FX")
  if (/^(i mean|no,?\s|actually\b|not that)\s+/i.test(t)) {
    const ctxLower = contextText.toLowerCase();
    if (ctxLower.includes('search') || ctxLower.includes('comeback') || ctxLower.includes('release') || ctxLower.includes('who') || ctxLower.includes('what') || ctxLower.includes('when')) {
      return { route: 'web_research', confidence: 0.94 };
    }
  }

  // Follow-up queries asking for continuation of research
  if (/^(continue|more|tell me more|what about the next one|when next|and next|what else)\b/i.test(t)) {
    if (contextText.toLowerCase().includes('search') || contextText.toLowerCase().includes('season') || contextText.toLowerCase().includes('episode') || contextText.toLowerCase().includes('release') || contextText.toLowerCase().includes('air')) {
      return { route: 'web_research', confidence: 0.92 };
    }
  }

  // Casual short chit-chat (only if no research or release query is present)
  const casualPattern = /^(hi|hey|hello|yo|thanks|thank you|cool|ok|okay|nice|true|yeah|yeap|yes|nope|got it|sounds good|lol|haha|alright|fair enough|that makes sense|good to know|interesting)[!.? ]*$/i;
  if (casualPattern.test(t.split('\n').pop() || t)) {
    return { route: 'casual_chat', confidence: 0.9 };
  }

  // Code / technical deep reasoning
  if (/(function|class|method|algorithm|implement|debug|refactor|code|typescript|javascript|python|swift|api endpoint|sql|regex|explain the (difference|tradeoff|architecture|concept))/i.test(t)) {
    return { route: 'deep_reasoning', confidence: 0.82 };
  }

  return null; // unknown — fall back to embedding-based routing or default
}

// ---------------------------------------------------------------------------
// Cosine similarity between two float arrays
// ---------------------------------------------------------------------------
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------------------------------------------------------------------------
// Embedding cache — avoids re-embedding identical prototype strings
// ---------------------------------------------------------------------------
const _embCache = new Map<string, number[]>();
let _embeddingUnavailable = false; // Fast-path flag to skip 2000ms timeouts if nomic-embed-text is missing

async function embed(text: string, ollamaModel = 'nomic-embed-text'): Promise<number[] | null> {
  if (_embeddingUnavailable) return null;
  if (_embCache.has(text)) return _embCache.get(text)!;
  try {
    const res = await fetch('http://127.0.0.1:11434/api/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ollamaModel, prompt: text }),
      signal: AbortSignal.timeout(1200), // 1.2s timeout
    });
    if (!res.ok) {
      if (res.status === 404) _embeddingUnavailable = true;
      return null;
    }
    const data = await res.json();
    if (Array.isArray(data?.embedding)) {
      _embCache.set(text, data.embedding);
      return data.embedding;
    }
  } catch {
    // Timeout or Ollama unavailable — disable embedding for session to eliminate latency
    _embeddingUnavailable = true;
  }
  return null;
}

// In-memory centroid cache — built lazily on first request per session
let _centroids: Map<LorRouteId, number[]> | null = null;

async function buildCentroids(): Promise<Map<LorRouteId, number[]>> {
  if (_centroids) return _centroids;

  const map = new Map<LorRouteId, number[]>();
  const routeIds = Object.keys(ROUTE_PROTOTYPES) as LorRouteId[];

  await Promise.all(
    routeIds.map(async (routeId) => {
      const utterances = ROUTE_PROTOTYPES[routeId];
      const vectors = await Promise.all(utterances.map((u) => embed(u)));
      const valid = vectors.filter((v): v is number[] => v !== null && v.length > 0);
      if (valid.length === 0) return;

      // Compute mean centroid vector (following semantic-router's approach)
      const dim = valid[0].length;
      const centroid = new Array<number>(dim).fill(0);
      for (const v of valid) {
        for (let i = 0; i < dim; i++) centroid[i] += v[i];
      }
      for (let i = 0; i < dim; i++) centroid[i] /= valid.length;
      map.set(routeId, centroid);
    })
  );

  _centroids = map;
  return map;
}

// ---------------------------------------------------------------------------
// Build routing context string (sliding window of last N turns + current message)
// This is the key insight from RouteLLM: routing on isolated queries loses
// conversational context. By including recent turns, the router correctly
// handles pronoun references, topic continuations, and intent shifts.
// ---------------------------------------------------------------------------
export function buildRoutingContext(
  currentMessage: string,
  chatHistory: Array<{ sender: 'user' | 'assistant'; text: string }>,
  windowSize = 3
): string {
  const recentTurns = chatHistory.slice(-windowSize * 2); // last N user+assistant pairs
  const context = recentTurns
    .map((m) => `${m.sender === 'user' ? 'User' : 'Lor'}: ${m.text.slice(0, 120)}`)
    .join('\n');
  return context ? `${context}\nUser: ${currentMessage}` : currentMessage;
}

// ---------------------------------------------------------------------------
// Main public router function
// - First applies heuristic rules (O(1), zero latency)
// - If unclear, embeds the routing context and computes cosine similarity
//   against route centroids (RouteLLM's embedding-based approach)
// - Falls back gracefully to casual_chat if Ollama is unavailable
// ---------------------------------------------------------------------------
export async function routeMessage(
  currentMessage: string,
  chatHistory: Array<{ sender: 'user' | 'assistant'; text: string }>,
  ollamaAvailable: boolean
): Promise<RouterDecision> {
  const contextText = buildRoutingContext(currentMessage, chatHistory);

  // Tier 1: Fast deterministic heuristics (Anthropic's "simple workflow" principle)
  const heuristic = heuristicRoute(currentMessage, contextText);
  if (heuristic && heuristic.confidence >= 0.88) {
    return {
      route: heuristic.route,
      confidence: heuristic.confidence,
      method: 'heuristic',
      contextSummary: contextText.slice(0, 200),
    };
  }

  // Tier 2: Embedding-based semantic routing (RouteLLM approach)
  if (ollamaAvailable && !_embeddingUnavailable) {
    try {
      const [centroids, queryVec] = await Promise.all([
        buildCentroids(),
        embed(contextText),
      ]);

      if (queryVec && centroids.size > 0) {
        let bestRoute: LorRouteId = 'casual_chat';
        let bestScore = -1;

        for (const [routeId, centroid] of centroids) {
          const score = cosineSimilarity(queryVec, centroid);
          if (score > bestScore) {
            bestScore = score;
            bestRoute = routeId;
          }
        }

        // Confidence threshold: below 0.28 means no route matched cleanly
        // Default to casual_chat in this case (graceful degradation)
        if (bestScore < 0.28) {
          bestRoute = 'casual_chat';
        }

        return {
          route: bestRoute,
          confidence: Math.max(0, Math.min(1, bestScore)),
          method: 'embedding',
          contextSummary: contextText.slice(0, 200),
        };
      }
    } catch {
      // Embedding failed — fall through to heuristic soft result
    }
  }

  // Tier 3: Use soft heuristic result even below confidence threshold
  if (heuristic) {
    return {
      route: heuristic.route,
      confidence: heuristic.confidence,
      method: 'heuristic',
      contextSummary: contextText.slice(0, 200),
    };
  }

  // Tier 4: Default to casual_chat — never crash, always respond
  return {
    route: 'casual_chat',
    confidence: 0.5,
    method: 'heuristic',
  };
}
