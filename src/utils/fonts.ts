import type React from 'react';

export const FONT_FAMILY = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_LETTER_SPACING = '-0.05em';

export const BASE_FONT: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  letterSpacing: FONT_LETTER_SPACING,
};

// Inject the DM Sans Google Fonts <link> into any document or shadow root.
// Safe to call multiple times — checks for an existing link first.
export function injectDmSans(target: Document | ShadowRoot = document): void {
  const href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap';

  const doc: Document = target instanceof Document ? target : target.ownerDocument ?? document;

  // For shadow roots, we inject a <style> with @import since <link> inside shadow DOM is unreliable
  if (target instanceof ShadowRoot) {
    if (target.querySelector('style[data-arrete-font]')) return;
    const style = doc.createElement('style');
    style.setAttribute('data-arrete-font', '');
    style.textContent = `@import url('${href}');`;
    target.prepend(style);
    return;
  }

  // For the main document, use a <link> in <head>
  if (doc.querySelector('link[data-arrete-font]')) return;
  const link = doc.createElement('link');
  link.setAttribute('data-arrete-font', '');
  link.rel = 'preconnect';
  link.href = 'https://fonts.gstatic.com';
  link.crossOrigin = '';
  doc.head.appendChild(link);

  const fontLink = doc.createElement('link');
  fontLink.setAttribute('data-arrete-font', '');
  fontLink.rel = 'stylesheet';
  fontLink.href = href;
  doc.head.appendChild(fontLink);
}
