import React from 'react';
import type { ScoredResult, ScoreReason } from '../utils/messaging';
import { FONT_FAMILY, FONT_LETTER_SPACING } from '../utils/fonts';

interface Props {
  result: ScoredResult;
  onClose: () => void;
}

const VERDICT_CONFIG = {
  green: {
    bg: '#f0fdf4',
    border: '#16a34a',
    iconFill: '#16a34a',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="#16a34a" />
        <path d="M8 14.5l4.5 4.5 8-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    headline: 'This site is safe.',
    sub: 'No significant risk signals were detected.\nYou may proceed normally.',
  },
  yellow: {
    bg: '#fffbeb',
    border: '#d97706',
    iconFill: '#d97706',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 2L2 25h24L14 2z" fill="#d97706" />
        <path d="M14 10v7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="20.5" r="1.4" fill="white" />
      </svg>
    ),
    headline: 'This site is suspicious.',
    sub: 'Use caution when navigating.\nConsider verifying this site before entering any info.',
  },
  red: {
    bg: '#fff5f5',
    border: '#dc2626',
    iconFill: '#dc2626',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 2L2 25h24L14 2z" fill="#dc2626" />
        <path d="M14 10v7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="14" cy="20.5" r="1.4" fill="white" />
      </svg>
    ),
    headline: 'This site could be a scam.',
    sub: 'Use caution when navigating the site.\nWe do not recommend entering any sensitive info.',
  },
} as const;

const REASON_SEVERITY_COLORS = {
  red: '#dc2626',
  yellow: '#d97706',
  green: '#16a34a',
};

const ReasonItem: React.FC<{ reason: ScoreReason }> = ({ reason }) => (
  <div
    style={{
      display: 'flex',
      gap: '10px',
      padding: '10px 0',
      borderBottom: '1px solid #f0f0f0',
    }}
  >
    <div
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: REASON_SEVERITY_COLORS[reason.severity],
        flexShrink: 0,
        marginTop: '5px',
      }}
    />
    <div>
      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#111' }}>
        {reason.label}
      </p>
      <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: 1.4 }}>
        {reason.detail}
      </p>
    </div>
  </div>
);

export const SafetyReport: React.FC<Props> = ({ result, onClose }) => {
  const v = VERDICT_CONFIG[result.verdict];

  const displayUrl =
    result.url.length > 46 ? result.url.slice(0, 44) + '…' : result.url;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        border: `2px solid ${v.border}`,
        width: '320px',
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
          padding: '10px 14px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', color: '#111' }}>
            Arrête
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase' }}>
            | Safety Report
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#888',
            fontSize: '16px',
            padding: '0 2px',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* URL bar */}
      <div
        style={{
          padding: '8px 14px',
          background: '#f9fafb',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '11px',
          color: '#555',
          wordBreak: 'break-all',
        }}
      >
        {displayUrl}
      </div>

      {/* Verdict banner */}
      <div
        style={{
          background: v.bg,
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px dashed #ddd',
        }}
      >
        {v.icon}
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111', textAlign: 'center' }}>
          {v.headline}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#555', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
          {v.sub}
        </p>
      </div>

      {/* Ticket notch */}
      <div style={{ position: 'relative', height: '1px', background: '#eee' }}>
        <div
          style={{
            position: 'absolute',
            left: '-10px',
            top: '-10px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            border: `2px solid ${v.border}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-10px',
            top: '-10px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            border: `2px solid ${v.border}`,
          }}
        />
      </div>

      {/* Reasons */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Here's why we think so:
        </p>
        {result.reasons.map((r, i) => (
          <ReasonItem key={i} reason={r} />
        ))}
      </div>
    </div>
  );
};
