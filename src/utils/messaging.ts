export type RiskLevel = 'green' | 'yellow' | 'red';

// Per-signal verdict shown in the report checklist — independent from the
// overall RiskLevel since a single signal can be a mild "warn" even when the
// overall site is safe, or vice versa.
export type SignalStatus = 'good' | 'warn' | 'bad';

export interface SignalBreakdown {
  status: SignalStatus;
  label: string;
  detail: string;
}

export interface SignalBreakdowns {
  domainAge: SignalBreakdown;
  typosquat: SignalBreakdown;
  safeBrowsing: SignalBreakdown;
  urgency: SignalBreakdown;
}

export interface ScoredResult {
  url: string;
  domain: string;
  score: number;
  verdict: RiskLevel;
  signals: SignalBreakdowns;
  timestamp: number;
}

export interface ExtensionStats {
  totalScanned: number;
  estimatedSavings: number;
  recentSites: ScoredResult[];
}

export type Message =
  | { type: 'SCORE_REQUEST'; url: string; urgencySignals: string[] }
  | { type: 'SCORE_RESPONSE'; result: ScoredResult }
  | { type: 'MANUAL_CHECK'; url: string }
  | { type: 'GET_SCORE_FOR_URL'; url: string }
  | { type: 'CURRENT_SCORE_RESPONSE'; result: ScoredResult | null }
  | { type: 'GET_STATS' }
  | { type: 'STATS_RESPONSE'; stats: ExtensionStats }
  | { type: 'SAVINGS_ADD'; amount: number };

export function sendMessage(message: Message): Promise<Message> {
  return chrome.runtime.sendMessage(message);
}
