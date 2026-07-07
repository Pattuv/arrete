/**
 * Detects whether the current page contains a payment / credit-card entry form.
 * Used to trigger checkout friction on risky sites.
 */
import { CART_BUTTON_PATTERNS } from './shoppingDetector';

const CHECKOUT_TEXT_PATTERNS = [
  /card\s+number/i,
  /credit\s+card/i,
  /debit\s+card/i,
  /expir(y|ation)/i,
  /cvv|cvc|security\s+code/i,
  /billing\s+address/i,
  /payment\s+(info|details|method)/i,
];

function hasPaymentInputs(): boolean {
  // Explicit autocomplete attributes
  const ccInputs = document.querySelectorAll<HTMLInputElement>(
    'input[autocomplete="cc-number"], input[autocomplete="cc-exp"], input[autocomplete="cc-csc"]'
  );
  if (ccInputs.length > 0) return true;

  // Stripe / Braintree / Adyen iframes
  const paymentFrames = document.querySelectorAll(
    'iframe[src*="stripe"], iframe[src*="braintree"], iframe[src*="adyen"], iframe[src*="paypal"]'
  );
  if (paymentFrames.length > 0) return true;

  // Type=tel inputs near checkout-related labels (common pattern for card fields)
  const telInputs = document.querySelectorAll<HTMLInputElement>('input[type="tel"]');
  for (const input of telInputs) {
    const container = input.closest('form') ?? input.parentElement;
    const containerText = container?.innerText ?? '';
    if (CHECKOUT_TEXT_PATTERNS.some(re => re.test(containerText))) return true;
  }

  return false;
}

function hasCheckoutLabels(): boolean {
  const bodyText = document.body.innerText;
  const matchCount = CHECKOUT_TEXT_PATTERNS.filter(re => re.test(bodyText)).length;
  return matchCount >= 2;
}

export function detectCheckoutPage(): boolean {
  return hasPaymentInputs() || hasCheckoutLabels();
}

const CHECKOUT_BUTTON_PATTERNS = [
  /place\s+order/i,
  /complete\s+(purchase|order)/i,
  /pay\s+now/i,
  /confirm\s+(order|payment)/i,
  /checkout/i,
  /submit\s+order/i,
];

const ALL_ACTION_PATTERNS = [...CART_BUTTON_PATTERNS, ...CHECKOUT_BUTTON_PATTERNS];

/**
 * Find the primary checkout / place-order button on the page.
 * Returns null if none found.
 */
export function findCheckoutButton(): HTMLElement | null {
  const buttons = document.querySelectorAll<HTMLElement>(
    'button[type="submit"], button, input[type="submit"]'
  );

  for (const btn of buttons) {
    const text = btn.innerText ?? btn.getAttribute('value') ?? '';
    if (CHECKOUT_BUTTON_PATTERNS.some(re => re.test(text))) return btn;
  }
  return null;
}

/**
 * Find all cart and checkout action buttons on the page — both "Add to Cart" /
 * "Buy Now" style buttons on product pages and "Place Order" / "Pay Now" style
 * buttons on checkout pages. Used to attach click interceptors.
 */
export function findActionButtons(): HTMLElement[] {
  const candidates = document.querySelectorAll<HTMLElement>(
    'button, a, input[type="submit"]'
  );
  const matched: HTMLElement[] = [];
  for (const el of candidates) {
    const text = (el.tagName === 'INPUT'
      ? el.getAttribute('value')
      : el.innerText) ?? '';
    if (ALL_ACTION_PATTERNS.some(re => re.test(text))) {
      matched.push(el);
    }
  }
  return matched;
}
