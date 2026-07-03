/**
 * Scans the page DOM for urgency / pressure-tactic language.
 * Returns a score from 0 (none) to 100 (maximum pressure).
 */

const URGENCY_PATTERNS = [
  // Countdown / time pressure
  /only\s+\d+\s+(hour|minute|second|hr|min|sec)/i,
  /\d+:\d{2}:\d{2}\s*(left|remaining|countdown)/i,
  /deal\s+ends\s+in/i,
  /offer\s+expires/i,
  /sale\s+ends/i,
  /today\s+only/i,
  /flash\s+sale/i,
  /limited[-\s]time\s+(offer|deal)/i,
  /hurry[!,]?\s*(up)?/i,
  /act\s+now/i,
  /don'?t\s+miss\s+(out|this)/i,

  // Stock scarcity
  /only\s+\d+\s+left\s+in\s+stock/i,
  /only\s+\d+\s+remaining/i,
  /\d+\s+left\s+in\s+stock/i,
  /low\s+stock/i,
  /almost\s+(gone|sold\s+out)/i,
  /selling\s+fast/i,
  /last\s+(few|chance)/i,

  // Social proof pressure
  /\d+\s+people\s+(are\s+)?(viewing|watching)/i,
  /\d+\s+in\s+(your|my)\s+cart/i,
  /\d+\s+sold\s+in\s+(the\s+)?last/i,
  /most\s+popular/i,

  // Discount urgency
  /\d+%\s+off\s+(today|now|only)/i,
  /price\s+drops\s+soon/i,
  /while\s+supplies\s+last/i,
  /exclusive\s+deal/i,
];

function countdownTimerPresent(): boolean {
  // Look for countdown-timer elements by common class/id names
  const selectors = [
    '[class*="countdown"]',
    '[class*="timer"]',
    '[id*="countdown"]',
    '[id*="timer"]',
    '[data-countdown]',
  ];
  return selectors.some(s => document.querySelector(s) !== null);
}

export function detectUrgencySignals(): string[] {
  const bodyText = document.body.innerText;
  const matched: string[] = [];

  for (const pattern of URGENCY_PATTERNS) {
    const m = bodyText.match(pattern);
    if (m) matched.push(m[0]);
  }

  if (countdownTimerPresent()) matched.push('Countdown timer detected');

  // Deduplicate
  return [...new Set(matched)];
}

export function scoreUrgency(signals: string[]): number {
  if (signals.length === 0) return 0;
  if (signals.length === 1) return 20;
  if (signals.length === 2) return 40;
  if (signals.length <= 4) return 65;
  return 100;
}
