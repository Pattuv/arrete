import { KNOWN_BRANDS } from '../utils/brands';

export default defineContentScript({
  matches: ['*://www.google.com/*', '*://shopping.google.com/*'],
  runAt: 'document_idle',

  main() {
    // Google now blends shopping carousels ("Popular products") into plain
    // /search results with no dedicated tbm=shop / udm=28 query param, so we
    // can't reliably gate on the URL anymore — just always scan. The
    // selectors below are specific to shopping-card seller elements, so this
    // is a no-op (and cheap) on pages with no shopping content.
    injectVerifiedBadges();

    // Re-run on DOM mutations (Google dynamically loads more results)
    const observer = new MutationObserver(() => injectVerifiedBadges());
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

/**
 * Extract candidate brand labels from a seller-name string, trying both:
 *  - domain-style text like "amazon.com" -> "amazon"
 *  - plain retailer names like "Best Buy" or "Dick's Sporting Goods" ->
 *    "bestbuy" / "dickssportinggoods" (alphanumeric-only, matching how
 *    KNOWN_BRANDS entries are written)
 */
function extractBrandCandidates(text: string): string[] {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\s*&\s*more$/i, '')
    .replace(/\s*and\s*more$/i, '')
    .trim();

  const candidates = new Set<string>();

  const domainMatch = cleaned.match(/^([a-z0-9-]+)\.(com|co|net|org|io|shop|store)?$/);
  if (domainMatch) candidates.add(domainMatch[1]);

  const beforeDot = cleaned.split('.')[0];
  if (beforeDot) candidates.add(beforeDot.replace(/[^a-z0-9]/g, ''));

  const alnumOnly = cleaned.replace(/[^a-z0-9]/g, '');
  if (alnumOnly) candidates.add(alnumOnly);

  return [...candidates];
}

function isKnownBrand(candidates: string[]): boolean {
  return candidates.some(label => KNOWN_BRANDS.includes(label));
}

function createBadge(): HTMLElement {
  const badge = document.createElement('span');
  badge.setAttribute('data-arrete-badge', 'true');
  badge.title = 'Verified trusted retailer — Arrête';
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    vertical-align: middle;
    color: #4666E5;
    cursor: default;
    flex-shrink: 0;
    pointer-events: auto;
  `;
  badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="18" height="18" aria-label="Verified retailer" role="img" style="display:block;fill:currentColor;pointer-events:none;"><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></svg>`;
  return badge;
}

function injectVerifiedBadges() {
  // Google Shopping's markup changes frequently and uses obfuscated, dynamically
  // generated class names. `.WJMUdc.rw5ecc` is the current (as of this writing)
  // leaf span holding just the plain seller name (e.g. "Best Buy", "Target")
  // inside the "Popular products" carousel and the dedicated Shopping tab.
  // Product breakdown panel (right-side panel opened by clicking a product card):
  //   - `.y4xTjf` — brand name div inside .K0G2dc store row (Sponsored stores)
  //   - `[data-report-feedback-about-context]` — brand name div in .EHWXMb
  //     store row (All stores); the attribute value IS the brand name.
  // `.WJMUdc.rw5ecc` covers the "Popular products" carousel seller labels.
  // The older selectors below are kept as harmless fallbacks.
  const selectors = [
    '.WJMUdc.rw5ecc',
    '.y4xTjf',
    '[data-report-feedback-about-context]',
    '.sh-np__seller-span',
    '.E5ocAb',
    '[aria-label*="Sold by"] span',
    '.LbUacb',
    '.aULzUe',
    '.merchant-name',
    '[data-merchant-name]',
  ];

  const candidates = document.querySelectorAll<HTMLElement>(selectors.join(', '));

  for (const el of candidates) {
    // Skip if we already added a badge
    if (el.querySelector('[data-arrete-badge]')) continue;

    const text = el.innerText?.trim();
    if (!text) continue;

    const candidateLabels = extractBrandCandidates(text);
    if (candidateLabels.length === 0) continue;

    if (isKnownBrand(candidateLabels)) {
      el.appendChild(createBadge());
    }
  }
}
