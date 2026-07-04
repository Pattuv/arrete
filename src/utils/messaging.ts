export type RiskLevel = 'green' | 'yellow' | 'red';

export interface ScoreReason {
  label: string;
  detail: string;
  severity: RiskLevel;
}

export interface ScoredResult {
  url: string;
  domain: string;
  score: number;
  verdict: RiskLevel;
  reasons: ScoreReason[];
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
