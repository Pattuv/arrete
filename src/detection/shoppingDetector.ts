/**
 * Detects whether the current page is a product/shopping page.
 * Returns true if enough signals are present, false otherwise.
 */

const PRICE_REGEX = /(\$|€|£|¥)\s*\d[\d,]*(\.\d{2})?/;

export const CART_BUTTON_PATTERNS = [
  /add\s+to\s+cart/i,
  /add\s+to\s+bag/i,
  /add\s+to\s+basket/i,
  /buy\s+now/i,
  /purchase\s+now/i,
  /order\s+now/i,
  /shop\s+now/i,
];

function hasProductSchema(): boolean {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? '');
      const type = data['@type'] ?? '';
      if (
        type === 'Product' ||
        type === 'Offer' ||
        (Array.isArray(type) && (type.includes('Product') || type.includes('Offer')))
      ) {
        return true;
      }
    } catch {
      // ignore parse errors
    }
  }
  return false;
}

function hasCartButton(): boolean {
  const buttons = document.querySelectorAll<HTMLElement>('button, a, input[type="submit"]');
  for (const el of buttons) {
    const text = el.innerText ?? el.getAttribute('value') ?? '';
    if (CART_BUTTON_PATTERNS.some(re => re.test(text))) return true;
  }
  return false;
}

function hasPricePattern(): boolean {
  // Check meta tags first (faster)
  const ogPrice = document.querySelector('meta[property="product:price:amount"]');
  if (ogPrice) return true;

  // Scan visible text in the body (limited to avoid perf issues)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let count = 0;
  let node: Node | null;
  while ((node = walker.nextNode()) && count < 500) {
    count++;
    if (PRICE_REGEX.test(node.textContent ?? '')) return true;
  }
  return false;
}

function hasEcommerceMetaTags(): boolean {
  const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content');
  if (ogType === 'product') return true;

  const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');
  if (twitterCard === 'product') return true;

  return false;
}

export function detectShoppingPage(): boolean {
  let signals = 0;
  if (hasProductSchema()) signals += 3;
  if (hasCartButton()) signals += 2;
  if (hasPricePattern()) signals += 1;
  if (hasEcommerceMetaTags()) signals += 2;
  return signals >= 2;
}
