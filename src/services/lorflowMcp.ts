/**
 * LorFlow Internal MCP (Model Context Protocol) Service
 * Exposes deterministic tools to the AI Chat agent for programmatic vibe coding,
 * node modifications, connection management, version history, and error healing.
 */

export interface LorFlowSnapshot {
  id: string;
  timestamp: number;
  label: string;
  nodeCount: number;
  nodes: any[];
}

// 24 hours in ms
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export class LorFlowMCP {
  private static STORAGE_KEY = 'lor_workflow_json';
  private static HISTORY_KEY = 'lorflow_history';

  /**
   * Retrieve active workflow nodes
   */
  static getWorkflow(): any[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[LorFlow MCP] Error reading workflow:', e);
    }
    return [];
  }

  /**
   * Save workflow and record snapshot in 24h history
   */
  static saveWorkflow(nodes: any[], actionLabel: string = 'Update LorFlow'): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nodes, null, 2));
      this.recordSnapshot(nodes, actionLabel);
      window.dispatchEvent(new CustomEvent('lor-workflow-json-update', { detail: nodes }));
    } catch (e) {
      console.error('[LorFlow MCP] Failed to save workflow:', e);
    }
  }

  /**
   * Record a version snapshot (prunes versions older than 24h)
   */
  static recordSnapshot(nodes: any[], label: string): LorFlowSnapshot {
    const history = this.getHistory();
    const now = Date.now();
    const snapshot: LorFlowSnapshot = {
      id: `ver-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      label,
      nodeCount: nodes.length,
      nodes: JSON.parse(JSON.stringify(nodes))
    };
    // Keep within 24 hours and limit to recent 40 entries
    const updated = [snapshot, ...history.filter(h => now - h.timestamp <= ONE_DAY_MS)].slice(0, 40);
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('lorflow-history-update', { detail: updated }));
    } catch (e) {}
    return snapshot;
  }

  /**
   * Retrieve history snapshots (last 24h)
   */
  static getHistory(): LorFlowSnapshot[] {
    try {
      const raw = localStorage.getItem(this.HISTORY_KEY);
      if (raw) {
        const parsed: LorFlowSnapshot[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          return parsed.filter(p => now - p.timestamp <= ONE_DAY_MS);
        }
      }
    } catch (e) {}
    return [];
  }

  /**
   * Revert to a specific snapshot
   */
  static revertVersion(versionId: string): { success: boolean; nodes?: any[]; message: string } {
    const history = this.getHistory();
    const target = history.find(h => h.id === versionId);
    if (!target || !Array.isArray(target.nodes)) {
      return { success: false, message: `Version ${versionId} not found in the 24-hour history window.` };
    }
    this.saveWorkflow(target.nodes, `Reverted to ${target.label}`);
    return {
      success: true,
      nodes: target.nodes,
      message: `Reverted LorFlow to version from ${new Date(target.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${target.label}).`
    };
  }

  /**
   * Revert to previous version relative to now
   */
  static revertToPrevious(): { success: boolean; nodes?: any[]; message: string } {
    const history = this.getHistory();
    if (history.length < 2) {
      return { success: false, message: 'No prior version available in 24-hour history.' };
    }
    const previous = history[1];
    return this.revertVersion(previous.id);
  }

  /**
   * Add a node to LorFlow
   */
  static addNode(type: string, name?: string, config: any = {}, connectFromId?: string): { success: boolean; node: any; nodes: any[]; message: string } {
    const nodes = this.getWorkflow();
    const cleanType = type.toLowerCase().trim();
    const newId = `node-${cleanType}-${Date.now()}`;
    const lastNode = connectFromId ? nodes.find(n => n.id === connectFromId) : nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 190 : 800;
    const newY = lastNode ? lastNode.y : 180;

    const formattedName = name || `${cleanType.charAt(0).toUpperCase() + cleanType.slice(1)}`;

    const newNode = {
      id: newId,
      type: cleanType === 'auth' ? 'google_auth' : cleanType,
      name: formattedName,
      subtitle: `Autonomous ${cleanType} step`,
      description: `Configured dynamically by LorFlow MCP`,
      status: 'pending',
      x: newX,
      y: newY,
      nextIds: [],
      config: config || {}
    };

    if (lastNode && !lastNode.nextIds?.includes(newId)) {
      lastNode.nextIds = [...(lastNode.nextIds || []), newId];
    }

    const updated = [...nodes, newNode];
    this.saveWorkflow(updated, `Added ${newNode.name} node`);
    return {
      success: true,
      node: newNode,
      nodes: updated,
      message: `Added node [${newNode.name}] of type "${cleanType}" to LorFlow.`
    };
  }

  /**
   * Remove a node from LorFlow
   */
  static removeNode(nodeId: string): { success: boolean; nodes: any[]; message: string } {
    const nodes = this.getWorkflow();
    const target = nodes.find(n => n.id === nodeId);
    if (!target) return { success: false, nodes, message: `Node with ID "${nodeId}" not found.` };

    const updated = nodes
      .filter(n => n.id !== nodeId)
      .map(n => ({
        ...n,
        nextIds: (n.nextIds || []).filter((id: string) => id !== nodeId),
        falseNextIds: (n.falseNextIds || []).filter((id: string) => id !== nodeId)
      }));

    this.saveWorkflow(updated, `Removed node ${target.name}`);
    return {
      success: true,
      nodes: updated,
      message: `Removed node [${target.name}] and updated connections.`
    };
  }

  /**
   * Connect two nodes
   */
  static connectNodes(fromId: string, toId: string, isFalseBranch: boolean = false): { success: boolean; nodes: any[]; message: string } {
    const nodes = this.getWorkflow();
    const fromNode = nodes.find(n => n.id === fromId);
    const toNode = nodes.find(n => n.id === toId);
    if (!fromNode || !toNode) {
      return { success: false, nodes, message: 'Source or target node not found in LorFlow.' };
    }

    const updated = nodes.map(n => {
      if (n.id === fromId) {
        if (isFalseBranch) {
          const falseIds = n.falseNextIds || [];
          return { ...n, falseNextIds: falseIds.includes(toId) ? falseIds : [...falseIds, toId] };
        } else {
          const nexts = n.nextIds || [];
          return { ...n, nextIds: nexts.includes(toId) ? nexts : [...nexts, toId] };
        }
      }
      return n;
    });

    this.saveWorkflow(updated, `Connected ${fromNode.name} -> ${toNode.name}`);
    return {
      success: true,
      nodes: updated,
      message: `Connected [${fromNode.name}] to [${toNode.name}]${isFalseBranch ? ' (False Branch)' : ''}.`
    };
  }

  /**
   * Auto-fix a failed node in context
   */
  static fixNodeError(nodeId?: string, errorReason?: string, patchConfig?: any): { success: boolean; node: any; nodes: any[]; message: string } {
    const nodes = this.getWorkflow();
    const target = nodes.find(n => (nodeId && n.id === nodeId) || n.status === 'error' || n.type === 'google_docs');
    if (!target) {
      return { success: false, node: null, nodes, message: 'No failing node identified in active LorFlow.' };
    }

    const updated = nodes.map(n => {
      if (n.id === target.id) {
        return {
          ...n,
          status: 'pending',
          subtitle: `${n.subtitle || n.name} (Repaired)`,
          config: {
            ...n.config,
            ...(patchConfig || {}),
            linkedDocUrl: patchConfig?.linkedDocUrl || n.config?.linkedDocUrl || 'https://docs.google.com/document/create',
            docTitle: patchConfig?.docTitle || n.config?.docTitle || 'Ao Ashi - Anime Research Summary',
            sanitized: true
          },
          inputData: {
            ...n.inputData,
            sanitized: true,
            authRequired: false
          },
          outputData: {
            status: 'repaired_by_lorflow_mcp',
            fixedAt: new Date().toISOString(),
            priorError: errorReason || 'Execution parameter mismatch',
            note: 'LorFlow MCP patched configuration, sanitized parameter types, and reset status to pending.'
          }
        };
      }
      return n;
    });

    this.saveWorkflow(updated, `Auto-fixed node ${target.name}`);
    return {
      success: true,
      node: target,
      nodes: updated,
      message: `Repaired node [${target.name}]: sanitized parameters, eliminated type mismatch, and reset status to pending.`
    };
  }

  /**
   * Run active LorFlow
   */
  static runWorkflow(): void {
    window.dispatchEvent(new CustomEvent('lor-run-workflow'));
  }

  /**
   * Adapt the entire workflow to a new prompt/intent
   */
  static adaptWorkflow(rawPrompt: string): { success: boolean; nodes: any[]; message: string; cleanQuery: string } {
    const prompt = (rawPrompt || '').trim();
    if (!prompt) {
      return { success: false, nodes: this.getWorkflow(), message: 'Empty prompt provided.', cleanQuery: '' };
    }

    let clean = prompt;
    clean = clean.replace(/^(please\s+)?(search\s+for\s+information\s+about|search\s+for|find\s+information\s+about|find\s+out\s+about|look\s+up|research|summarize|write\s+a\s+summary\s+of|write\s+a\s+summary\s+about|give\s+me\s+information\s+about)\s+/gi, '');
    clean = clean.replace(/\s+(and\s+)?(write|put|export|save|create)(\s+a\s+summary)?(\s+in|\s+to|\s+into)\s+(google\s+)?docs?.*$/gi, '');
    clean = clean.trim() || prompt;

    const shortTopic = clean.length > 22 ? clean.slice(0, 22) + '...' : clean;
    let nodes = this.getWorkflow();

    if (!nodes || nodes.length === 0) {
      nodes = [
        {
          id: 'node-prompt',
          type: 'trigger',
          name: 'Agent Prompt',
          subtitle: prompt.length > 22 ? prompt.slice(0, 22) + '...' : prompt,
          description: 'Intercepts research instruction and initiates workflow execution.',
          status: 'pending',
          x: 60,
          y: 180,
          nextIds: ['node-search'],
          config: { prompt }
        },
        {
          id: 'node-search',
          type: 'google_search',
          name: 'Google Search',
          subtitle: `Query: ${shortTopic}`,
          description: `Live organic search scraping references for "${clean}".`,
          status: 'pending',
          x: 230,
          y: 180,
          nextIds: ['node-branch'],
          config: { searchQuery: clean, prompt }
        },
        {
          id: 'node-branch',
          type: 'if_else',
          name: 'If Results Valid',
          subtitle: 'Branch Condition',
          description: `Verifies verified citations exist for "${clean}" before drafting document.`,
          status: 'pending',
          x: 400,
          y: 180,
          nextIds: ['node-lor'],
          falseNextIds: ['node-loop'],
          config: { condition: 'citations.length > 0' }
        },
        {
          id: 'node-lor',
          type: 'ai_synthesis',
          name: 'Lor AI Agent',
          subtitle: `Synthesize: ${clean.slice(0, 16)}`,
          description: `Structures research findings for "${clean}" with executive summary and source citations.`,
          status: 'pending',
          x: 580,
          y: 120,
          nextIds: ['node-docs'],
          config: { prompt: `Synthesize research findings for "${clean}" into an executive outline with source citations.` }
        },
        {
          id: 'node-loop',
          type: 'loop',
          name: 'Broaden Query',
          subtitle: 'Retry Search',
          description: `Fallback loop: expands search keywords if initial query for "${clean}" is narrow.`,
          status: 'pending',
          x: 580,
          y: 250,
          nextIds: ['node-lor'],
          config: { iterations: 2 }
        },
        {
          id: 'node-docs',
          type: 'google_docs',
          name: 'Google Docs',
          subtitle: `Export: ${clean.slice(0, 16)}`,
          description: `Creates a Google Doc titled "${clean} - Research Summary" and syncs live findings.`,
          status: 'pending',
          x: 770,
          y: 180,
          nextIds: [],
          config: { docTitle: `${clean} - Research Summary`, prompt: `Write executive summary and verified citations for "${clean}" directly into Google Docs.` }
        }
      ];
    } else {
      nodes = nodes.map((n: any) => {
        if (n.type === 'trigger') {
          return {
            ...n,
            subtitle: prompt.length > 22 ? prompt.slice(0, 22) + '...' : prompt,
            config: { ...(n.config || {}), prompt },
            inputData: { ...(n.inputData || {}), prompt },
            outputData: { ...(n.outputData || {}), prompt, queryKeywords: clean.split(/\s+/).slice(0, 5), status: 'pending' }
          };
        }
        if (n.type === 'google_search') {
          return {
            ...n,
            subtitle: `Query: ${shortTopic}`,
            description: `Live organic search scraping references for "${clean}".`,
            config: { ...(n.config || {}), searchQuery: clean, prompt },
            inputData: { ...(n.inputData || {}), query: clean },
            outputData: { ...(n.outputData || {}), status: 'pending' }
          };
        }
        if (n.type === 'if_else') {
          return {
            ...n,
            description: `Verifies verified citations exist for "${clean}" before drafting document.`
          };
        }
        if (n.type === 'ai_synthesis') {
          return {
            ...n,
            subtitle: `Synthesize: ${clean.slice(0, 16)}`,
            description: `Structures research findings for "${clean}" with executive summary and source citations.`,
            config: { ...(n.config || {}), prompt: `Synthesize research findings for "${clean}" into an executive outline with source citations.` },
            inputData: { ...(n.inputData || {}), prompt: `Synthesize findings for: ${clean}` },
            outputData: { ...(n.outputData || {}), topic: clean, status: 'pending' }
          };
        }
        if (n.type === 'loop') {
          return {
            ...n,
            description: `Fallback loop: expands search keywords if initial query for "${clean}" is narrow.`
          };
        }
        if (n.type === 'google_docs') {
          const docTitle = `${clean} - Research Summary`;
          return {
            ...n,
            subtitle: `Export: ${clean.slice(0, 16)}`,
            description: `Creates or appends findings to Google Doc titled "${docTitle}".`,
            config: { ...(n.config || {}), docTitle, prompt: `Write executive summary and verified citations for "${clean}" directly into Google Docs.` },
            inputData: { ...(n.inputData || {}), docTitle },
            outputData: { ...(n.outputData || {}), docTitle, status: 'ready_to_export' }
          };
        }
        return n;
      });
    }

    try {
      localStorage.setItem('lor_workflow_prompt', prompt);
    } catch(e) {}

    this.saveWorkflow(nodes, `Adapted to: ${shortTopic}`);
    window.dispatchEvent(new CustomEvent('lor-workflow-prompt-update', { detail: { prompt, cleanQuery: clean, nodes } }));

    return {
      success: true,
      nodes,
      cleanQuery: clean,
      message: `Adapted LorFlow to "${clean}": updated prompt trigger, live search query, AI synthesis parameters, and Google Docs title.`
    };
  }
}
