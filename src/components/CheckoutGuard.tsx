import React, { useEffect, useState } from 'react';
import type { ScoredResult } from '../utils/messaging';
import { FONT_FAMILY, FONT_LETTER_SPACING } from '../utils/fonts';

interface Props {
  result: ScoredResult;
  onComplete: () => void;
  onViewReport: () => void;
}

const COUNTDOWN_SECONDS = 10;

export const CheckoutGuard: React.FC<Props> = ({ result, onComplete, onViewReport }) => {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setDone(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const progress = ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        border: '2px solid #dc2626',
        width: '300px',
        fontFamily: FONT_FAMILY,
        letterSpacing: FONT_LETTER_SPACING,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#dc2626',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 21h20L12 2z" fill="white" />
          <path d="M12 9v5" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.1" fill="#dc2626" />
        </svg>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
          Arrête — Hold On
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#111', lineHeight: 1.4 }}>
          This site shows signs of pressure tactics.
        </p>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
          Take a moment before entering your payment information. You will be able to continue in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}.
        </p>

        {/* Progress bar */}
        <div
          style={{
            height: '4px',
            background: '#fee2e2',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#dc2626',
              borderRadius: '2px',
              transition: 'width 1s linear',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onViewReport}
            style={{
              width: '100%',
              padding: '10px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            View Safety Report
          </button>

          {done ? (
            <button
              onClick={onComplete}
              style={{
                width: '100%',
                padding: '10px',
                background: 'white',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            >
              Continue Anyway
            </button>
          ) : (
            <div
              style={{
                width: '100%',
                padding: '10px',
                background: '#f5f5f5',
                color: '#aaa',
                border: '1px solid #eee',
                borderRadius: '6px',
                fontSize: '13px',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            >
              Continue Anyway ({secondsLeft}s)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
