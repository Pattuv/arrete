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

    document.addEventListener('arrete:event', handler);
    return () => document.removeEventListener('arrete:event', handler);
  }, [guardDismissed]);

  if (mode === 'hidden') return null;
  if (!result) return null;

  return (
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
