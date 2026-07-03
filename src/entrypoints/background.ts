import { runScoring } from '../scoring/engine';
import { recordScan, getStats, addSavings, getScoreForDomain } from '../storage/stats';
import type { Message, ScoredResult } from '../utils/messaging';

export default defineBackground(() => {
  // Per-tab score cache: tabId → ScoredResult
  const tabScores = new Map<number, ScoredResult>();

  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      (async () => {
        try {
          switch (message.type) {
            case 'SCORE_REQUEST': {
              const tabId = sender.tab?.id;
              const { url, urgencySignals } = message;

              const hostname = new URL(url).hostname;
              const cached = await getScoreForDomain(hostname);
              if (cached) {
                if (tabId !== undefined) tabScores.set(tabId, cached);
                sendResponse({ type: 'SCORE_RESPONSE', result: cached } satisfies Message);
                return;
              }

              const result = await runScoring(url, urgencySignals);
              if (tabId !== undefined) tabScores.set(tabId, result);
              await recordScan(result);

              sendResponse({ type: 'SCORE_RESPONSE', result } satisfies Message);
              break;
            }

            case 'MANUAL_CHECK': {
              const result = await runScoring(message.url, []);
              const tabId = sender.tab?.id;
              if (tabId !== undefined) tabScores.set(tabId, result);
              await recordScan(result);
              sendResponse({ type: 'SCORE_RESPONSE', result } satisfies Message);
              break;
            }

            case 'GET_CURRENT_SCORE': {
              const tabId = sender.tab?.id;
              const result = tabId !== undefined ? (tabScores.get(tabId) ?? null) : null;
              sendResponse({ type: 'CURRENT_SCORE_RESPONSE', result } satisfies Message);
              break;
            }

            case 'GET_STATS': {
              const stats = await getStats();
              sendResponse({ type: 'STATS_RESPONSE', stats } satisfies Message);
              break;
            }

            case 'SAVINGS_ADD': {
              await addSavings(message.amount);
              sendResponse({ type: 'STATS_RESPONSE', stats: await getStats() } satisfies Message);
              break;
            }

            default:
              sendResponse(null);
          }
        } catch (err) {
          console.error('[Arrête background]', err);
          sendResponse(null);
        }
      })();

      return true;
    }
  );

  chrome.tabs.onRemoved.addListener(tabId => {
    tabScores.delete(tabId);
  });
});
