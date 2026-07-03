import type { ExtensionStats, ScoredResult } from '../utils/messaging';

const STORAGE_KEY = 'arrete_stats';
const MAX_RECENT = 50;

const DEFAULT_STATS: ExtensionStats = {
  totalScanned: 0,
  estimatedSavings: 0,
  recentSites: [],
};

export async function getStats(): Promise<ExtensionStats> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as ExtensionStats) ?? DEFAULT_STATS;
}

export async function recordScan(scored: ScoredResult): Promise<void> {
  const stats = await getStats();

  // Avoid double-counting the same domain within 5 minutes
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const alreadyCounted = stats.recentSites.some(
    s => s.domain === scored.domain && s.timestamp > fiveMinutesAgo
  );

  if (!alreadyCounted) {
    stats.totalScanned += 1;
  }

  // Keep recent sites list trimmed
  stats.recentSites = [
    scored,
    ...stats.recentSites.filter(s => s.domain !== scored.domain),
  ].slice(0, MAX_RECENT);

  await chrome.storage.local.set({ [STORAGE_KEY]: stats });
}

export async function addSavings(amount: number): Promise<void> {
  const stats = await getStats();
  stats.estimatedSavings = parseFloat((stats.estimatedSavings + amount).toFixed(2));
  await chrome.storage.local.set({ [STORAGE_KEY]: stats });
}

export async function getScoreForDomain(domain: string): Promise<ScoredResult | null> {
  const stats = await getStats();
  const recent = stats.recentSites.find(s => s.domain === domain);
  if (!recent) return null;
  // Return null if the cached result is older than 30 minutes
  if (Date.now() - recent.timestamp > 30 * 60 * 1000) return null;
  return recent;
}
