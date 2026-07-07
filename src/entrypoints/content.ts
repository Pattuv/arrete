import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { detectShoppingPage } from '../detection/shoppingDetector';
import { detectCheckoutPage, findActionButtons } from '../detection/checkoutDetector';
import { detectUrgencySignals } from '../scoring/urgency';
import type { Message, ScoredResult } from '../utils/messaging';
import { ContentApp } from '../components/ContentApp';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'arrete-overlay',
      // 'inline' skips WXT's built-in absolute/fixed wrapper logic entirely — we
      // handle positioning ourselves inside ContentApp so the host never becomes
      // a full-viewport click-blocking layer, and never drifts on scroll.
      position: 'inline',
      anchor: 'html',
      append: 'last',
      css: `
        :host {
          all: initial !important;
          display: block !important;
          width: 0 !important;
          height: 0 !important;
          overflow: visible !important;
        }
      `,
      onMount(container) {
        const root = createRoot(container);
        root.render(createElement(ContentApp));
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();

    // Dispatch an event to ContentApp through the shadow boundary
    function dispatch(type: string, payload: unknown) {
      document.dispatchEvent(
        new CustomEvent('arrete:event', {
          bubbles: true,
          composed: true,
          detail: { type, payload },
        })
      );
    }

    if (!detectShoppingPage()) return;

    const urgencySignals = detectUrgencySignals();

    let result: ScoredResult | null = null;

    // The MV3 background service worker can be dormant when a tab first loads.
    // If the first sendMessage call fails (worker not yet awake), wait briefly
    // and retry once before giving up.
    async function sendScoreRequest(): Promise<Message | null> {
      const req = {
        type: 'SCORE_REQUEST' as const,
        url: window.location.href,
        urgencySignals,
      } satisfies Message;
      try {
        return (await chrome.runtime.sendMessage(req)) as Message;
      } catch {
        await new Promise(r => setTimeout(r, 600));
        try {
          return (await chrome.runtime.sendMessage(req)) as Message;
        } catch {
          return null;
        }
      }
    }

    const response = await sendScoreRequest();
    if (response?.type === 'SCORE_RESPONSE') {
      result = response.result;
      dispatch('ARRETE_SCORE', result);

      if (result.verdict === 'red') {
        trackPotentialSavings();
      }
    }

    if (!result) return;

    if (result.verdict === 'green') return;

    // --- Click interception ---
    // Track which buttons already have an interceptor so we don't double-attach.
    const intercepted = new WeakSet<HTMLElement>();

    function interceptButton(btn: HTMLElement) {
      if (intercepted.has(btn)) return;
      intercepted.add(btn);

      const handler = (e: MouseEvent) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        const proceed = () => {
          btn.removeEventListener('click', handler, true);
          // <a> tags: follow href directly since re-clicking a prevented anchor
          // does not re-trigger navigation even after the listener is removed.
          if (btn.tagName === 'A') {
            const href = btn.getAttribute('href');
            if (href) window.location.href = href;
          } else {
            btn.click();
          }
        };

        dispatch('ARRETE_CHECKOUT', { proceed });
      };

      btn.addEventListener('click', handler, true); // capture phase
    }

    // Attach to all buttons present now.
    findActionButtons().forEach(interceptButton);

    // Also catch buttons injected after initial load (SPAs, lazy cart widgets).
    // Keep detectCheckoutPage() as a secondary fallback for pages where the
    // user reaches a payment form without ever clicking an intercepted button.
    let checkoutFallbackShown = false;
    const observer = new MutationObserver(() => {
      findActionButtons().forEach(interceptButton);

      if (!checkoutFallbackShown && detectCheckoutPage()) {
        checkoutFallbackShown = true;
        dispatch('ARRETE_CHECKOUT', { proceed: undefined });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    ctx.onInvalidated(() => observer.disconnect());
  },
});

function trackPotentialSavings() {
  const PRICE_REGEX = /(\$|€|£)\s*(\d[\d,]*(\.\d{1,2})?)/g;
  let maxPrice = 0;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    let match: RegExpExecArray | null;
    const text = node.textContent ?? '';
    while ((match = PRICE_REGEX.exec(text)) !== null) {
      const price = parseFloat(match[2].replace(',', ''));
      if (!isNaN(price) && price > maxPrice && price < 10000) maxPrice = price;
    }
  }

  if (maxPrice > 0) {
    const pageUrl = window.location.href;
    window.addEventListener('beforeunload', () => {
      if (window.location.href === pageUrl) {
        chrome.runtime.sendMessage({ type: 'SAVINGS_ADD', amount: maxPrice } satisfies Message);
      }
    }, { once: true });
  }
}
