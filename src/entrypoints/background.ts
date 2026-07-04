import { runScoring } from '../scoring/engine';
import {
  recordScan,
  getStats,
  addSavings,
  getScoreForDomain,
  hasShownOnboarding,
} from '../storage/stats';
import type { Message } from '../utils/messaging';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      (async () => {
        try {
          switch (message.type) {
            case 'SCORE_REQUEST': {
              const { url, urgencySignals } = message;
              const hostname = new URL(url).hostname;

              const cached = await getScoreForDomain(hostname);
              if (cached) {
                sendResponse({ type: 'SCORE_RESPONSE', result: cached } satisfies Message);
                return;
              }

              const result = await runScoring(url, urgencySignals);
              await recordScan(result);
              sendResponse({ type: 'SCORE_RESPONSE', result } satisfies Message);
              break;
            }

            case 'MANUAL_CHECK': {
              // Reuse the cached score for this domain if one already exists —
              // otherwise a manual check on an already-scanned site could produce
              // a different-looking report than the one shown automatically.
              const hostname = new URL(message.url).hostname;
              const cached = await getScoreForDomain(hostname);
              if (cached) {
                sendResponse({ type: 'SCORE_RESPONSE', result: cached } satisfies Message);
                break;
              }

              const result = await runScoring(message.url, []);
              await recordScan(result);
              sendResponse({ type: 'SCORE_RESPONSE', result } satisfies Message);
              break;
            }

            case 'GET_SCORE_FOR_URL': {
              const hostname = new URL(message.url).hostname;
              const result = await getScoreForDomain(hostname);
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

  // Open the toolbar popup for first-time onboarding. If Chrome blocks
  // programmatic open (no user gesture), the popup shows onboarding the
  // first time the user clicks the icon instead.
  chrome.runtime.onInstalled.addListener(() => {
    (async () => {
      try {
        if (await hasShownOnboarding()) return;
        await chrome.action.openPopup();
      } catch {
        // Popup will show onboarding on next icon click
      }
    })();
  });
});
