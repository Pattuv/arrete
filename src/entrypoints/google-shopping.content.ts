import { KNOWN_BRANDS } from '../utils/brands';

export default defineContentScript({
  matches: ['*://www.google.com/*', '*://shopping.google.com/*'],
  runAt: 'document_idle',

  main() {
    // Only proceed if this is a shopping results page
    if (!isShoppingPage()) return;

    injectVerifiedBadges();

    // Re-run on DOM mutations (Google dynamically loads more results)
    const observer = new MutationObserver(() => injectVerifiedBadges());
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

function isShoppingPage(): boolean {
  // Shopping tab in regular Google Search
  if (window.location.search.includes('tbm=shop')) return true;
  // Dedicated Google Shopping domain
  if (window.location.hostname === 'shopping.google.com') return true;
  return false;
}

/** Extract the registrable domain label from a string like "amazon.com" or "www.amazon.com" */
function extractBrandLabel(text: string): string | null {
  const cleaned = text.trim().toLowerCase().replace(/^www\./, '');
  // Match "brand.tld" or just "brand"
  const match = cleaned.match(/^([a-z0-9-]+)\.(com|co|net|org|io|shop|store)?$/);
  return match ? match[1] : cleaned.split('.')[0] || null;
}

function isKnownBrand(label: string): boolean {
  return KNOWN_BRANDS.includes(label);
}

function createBadge(): HTMLElement {
  const badge = document.createElement('span');
  badge.setAttribute('data-arrete-badge', 'true');
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 600;
    color: #16a34a;
    background: #dcfce7;
    border: 1px solid #86efac;
    border-radius: 4px;
    padding: 1px 5px;
    margin-left: 4px;
    vertical-align: middle;
    white-space: nowrap;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    letter-spacing: -0.05em;
    line-height: 1.6;
  `;
  badge.innerHTML = `<svg width="9" height="9" viewBox="0 0 9 9" fill="none" style="flex-shrink:0"><circle cx="4.5" cy="4.5" r="4.5" fill="#16a34a"/><path d="M2.5 4.5l1.5 1.5 3-3" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Verified Retailer`;
  return badge;
}

function injectVerifiedBadges() {
  // Google Shopping uses several layouts; these selectors cover the common ones.
  // We look for any element that contains just a domain-like seller name.
  const selectors = [
    // Standard shopping grid: seller text
    '.sh-np__seller-span',
    '.E5ocAb',
    '[aria-label*="Sold by"] span',
    // Inline results
    '.LbUacb',
    '.aULzUe',
    // Product panels
    '.merchant-name',
    '[data-merchant-name]',
  ];

  const candidates = document.querySelectorAll<HTMLElement>(selectors.join(', '));

  for (const el of candidates) {
    // Skip if we already added a badge
    if (el.querySelector('[data-arrete-badge]')) continue;

    const text = el.innerText?.trim();
    if (!text) continue;

    const label = extractBrandLabel(text);
    if (!label) continue;

    if (isKnownBrand(label)) {
      el.appendChild(createBadge());
    }
  }
}
