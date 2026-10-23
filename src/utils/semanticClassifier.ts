import { Tab } from '../types/browser';

export type SemanticCategory = 
  | 'DEV & TECH'
  | 'COMMUNICATIONS'
  | 'MEDIA & VIDEO'
  | 'RESEARCH & DOCS'
  | 'LIFESTYLE & TRAVEL'
  | 'GENERAL';

export function classifyTab(tab: Tab): SemanticCategory {
  const text = `${tab.url} ${tab.title}`.toLowerCase();

  // 1. Dev & Engineering
  if (
    text.includes('github') || 
    text.includes('gitlab') || 
    text.includes('stackoverflow') || 
    text.includes('medium') || 
    text.includes('system design') || 
    text.includes('developer') || 
    text.includes('docker') || 
    text.includes('huggingface') || 
    text.includes('api') || 
    text.includes('claude') || 
    text.includes('openai')
  ) {
    return 'DEV & TECH';
  }

  // 2. Communications & Social
  if (
    text.includes('slack') || 
    text.includes('discord') || 
    text.includes('linkedin') || 
    text.includes('proton') || 
    text.includes('mail') || 
    text.includes('twitter') || 
    text.includes('reddit') || 
    text.includes('browser company')
  ) {
    return 'COMMUNICATIONS';
  }

  // 3. Media & Entertainment
  if (
    text.includes('youtube') || 
    text.includes('spotify') || 
    text.includes('netflix') || 
    text.includes('myanimelist') || 
    text.includes('anime') || 
    text.includes('twitch') || 
    text.includes('asianfanfics') || 
    text.includes('video')
  ) {
    return 'MEDIA & VIDEO';
  }

  // 4. Research & Docs
  if (
    text.includes('wikipedia') || 
    text.includes('owasp') || 
    text.includes('molding') || 
    text.includes('excalidraw') || 
    text.includes('arxiv') || 
    text.includes('docs')
  ) {
    return 'RESEARCH & DOCS';
  }

  // 5. Lifestyle & Travel & Commerce
  if (
    text.includes('tripadvisor') || 
    text.includes('gymbeam') || 
    text.includes('restaurant') || 
    text.includes('amazon') || 
    text.includes('shopping') || 
    text.includes('fitness')
  ) {
    return 'LIFESTYLE & TRAVEL';
  }

  return 'GENERAL';
}

export function semanticTidyTabs(tabs: Tab[], currentSpaceId: string): Tab[] {
  // Deduplicate by URL
  const seenUrls = new Set<string>();
  const otherSpaceTabs: Tab[] = [];
  const currentSpaceTabs: Tab[] = [];

  tabs.forEach((t) => {
    if (t.spaceId !== currentSpaceId) {
      otherSpaceTabs.push(t);
    } else {
      if (!seenUrls.has(t.url)) {
        seenUrls.add(t.url);
        currentSpaceTabs.push(t);
      }
    }
  });

  const pinned = currentSpaceTabs.filter((t) => t.pinned);
  const unpinned = currentSpaceTabs.filter((t) => !t.pinned);

  // Group unpinned by semantic category
  const categoryOrder: SemanticCategory[] = [
    'DEV & TECH',
    'RESEARCH & DOCS',
    'COMMUNICATIONS',
    'MEDIA & VIDEO',
    'LIFESTYLE & TRAVEL',
    'GENERAL'
  ];

  const sortedUnpinned = [...unpinned].sort((a, b) => {
    const catA = classifyTab(a);
    const catB = classifyTab(b);
    const idxA = categoryOrder.indexOf(catA);
    const idxB = categoryOrder.indexOf(catB);
    if (idxA !== idxB) return idxA - idxB;
    return a.title.localeCompare(b.title);
  });

  return [...otherSpaceTabs, ...pinned, ...sortedUnpinned];
}
