import React, { useEffect, useState } from 'react';
import type { ScoredResult } from '../utils/messaging';
import { FONT_FAMILY, FONT_LETTER_SPACING, injectDmSans } from '../utils/fonts';
import { Toast } from './Toast';
import { SafetyReport } from './SafetyReport';
import { CheckoutGuard } from './CheckoutGuard';

export type OverlayMode = 'hidden' | 'toast' | 'report' | 'guard';

export const ContentApp: React.FC = () => {
  const [mode, setMode] = useState<OverlayMode>('hidden');
  const [result, setResult] = useState<ScoredResult | null>(null);
  const [guardDismissed, setGuardDismissed] = useState(false);

  useEffect(() => {
    // Inject DM Sans into the host document — @font-face definitions pierce shadow DOM
    injectDmSans(document);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const { type, payload } = (e as CustomEvent<{ type: string; payload: unknown }>).detail;

      if (type === 'ARRETE_SCORE') {
        const scored = payload as ScoredResult;
        setResult(scored);
        setMode('toast');
      }

      if (type === 'ARRETE_CHECKOUT' && !guardDismissed) {
        setMode(prev => (prev === 'hidden' ? 'guard' : prev === 'toast' ? 'guard' : prev));
      }
    };

    // composed: true lets the event pierce shadow DOM boundaries
    document.addEventListener('arrete:event', handler);
    return () => document.removeEventListener('arrete:event', handler);
  }, [guardDismissed]);

  if (mode === 'hidden' || !result) return null;

  return (
    // This wrapper is the ONLY element rendered inside our shadow host, and it is
    // sized to fit its content exactly (never full-viewport). It is pinned to the
    // real browser viewport via `position: fixed`, which — because neither the
    // shadow host nor any of its ancestors has a transform/filter/perspective set —
    // resolves against the viewport itself, not any page container. This means it
    // never drifts on scroll and is never trapped behind a transformed ancestor.
    // Because the box is only as big as the card, it can never intercept clicks
    // anywhere else on the page.
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 2147483647,
        fontFamily: FONT_FAMILY,
        letterSpacing: FONT_LETTER_SPACING,
      }}
    >
      {mode === 'toast' && (
        <Toast
          result={result}
          onExpand={() => setMode('report')}
          onClose={() => setMode('hidden')}
        />
      )}
      {mode === 'report' && (
        <SafetyReport
          result={result}
          onClose={() => setMode('hidden')}
        />
      )}
      {mode === 'guard' && (
        <CheckoutGuard
          result={result}
          onComplete={() => {
            setGuardDismissed(true);
            setMode('toast');
          }}
          onViewReport={() => setMode('report')}
        />
      )}
    </div>
  );
};
