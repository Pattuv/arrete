import React from 'react';
import type { ScoredResult } from '../utils/messaging';
import { FONT_FAMILY, FONT_LETTER_SPACING } from '../utils/fonts';

interface Props {
  result: ScoredResult;
  onExpand: () => void;
  onClose: () => void;
}

const VERDICTS = {
  green: {
    border: '#16a34a',
    iconBg: '#dcfce7',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="11" fill="#16a34a" />
        <path d="M6 11.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    badge: 'VERIFIED',
    headline: 'You may shop freely.',
    sub: 'This site is all clear.',
  },
  yellow: {
    border: '#d97706',
    iconBg: '#fef3c7',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 21h20L12 2z" fill="#d97706" />
        <path d="M12 9v5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.1" fill="white" />
      </svg>
    ),
    badge: 'WARNING',
    headline: 'This site is suspicious',
    sub: '',
  },
  red: {
    border: '#dc2626',
    iconBg: '#fee2e2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 21h20L12 2z" fill="#dc2626" />
        <path d="M12 9v5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.1" fill="white" />
      </svg>
    ),
    badge: 'WARNING',
    headline: 'This site could be a scam.',
    sub: '',
  },
} as const;

export const Toast: React.FC<Props> = ({ result, onExpand, onClose }) => {
  const v = VERDICTS[result.verdict];

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: `2px solid ${v.border}`,
        width: '285px',
        fontFamily: FONT_FAMILY,
        letterSpacing: FONT_LETTER_SPACING,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#111' }}>
          Arrête
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#888',
            fontSize: '15px',
            padding: '0 2px',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px 6px' }}>
        {/* Icon */}
        <div
          style={{
            background: v.iconBg,
            borderRadius: '8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {v.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          {result.verdict !== 'green' && (
            <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: v.border }}>
              {v.badge}
            </p>
          )}
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111', lineHeight: 1.35 }}>
            {v.headline}
          </p>
          {v.sub && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#555' }}>{v.sub}</p>
          )}
        </div>
      </div>

      {/* Footer link */}
      <button
        onClick={onExpand}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 14px',
          background: 'none',
          border: 'none',
          borderTop: '1px solid #f0f0f0',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '12px',
          color: '#555',
          fontFamily: 'inherit',
        }}
      >
        Click for full report →
      </button>
    </div>
  );
};
