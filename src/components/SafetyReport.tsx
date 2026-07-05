import React from 'react';
import type { ScoredResult, SignalStatus } from '../utils/messaging';
import { FONT_FAMILY, FONT_LETTER_SPACING } from '../utils/fonts';
import reportGreen from '../assets/reports/reportgreen.png';
import reportOrange from '../assets/reports/reportorange.png';
import reportRed from '../assets/reports/reportred.png';

interface Props {
  result: ScoredResult;
  onClose: () => void;
}

const REPORT_IMAGE = {
  green: reportGreen,
  yellow: reportOrange,
  red: reportRed,
} as const;

const STATUS_COLOR: Record<SignalStatus, string> = {
  good: '#178800',
  warn: '#d97706',
  bad: '#dc2626',
};

const STATUS_ICON: Record<SignalStatus, React.ReactNode> = {
  good: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6.5" fill={STATUS_COLOR.good} />
      <path d="M3.6 6.8l1.9 1.9 3.9-4.3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warn: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 0.7L12.6 12H0.4L6.5 0.7z" fill={STATUS_COLOR.warn} />
      <rect x="5.85" y="4.6" width="1.3" height="3.2" rx="0.65" fill="white" />
      <circle cx="6.5" cy="9.6" r="0.8" fill="white" />
    </svg>
  ),
  bad: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6.5" fill={STATUS_COLOR.bad} />
      <path d="M4.2 4.2l4.6 4.6M8.8 4.2l-4.6 4.6" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
};

export const SafetyReport: React.FC<Props> = ({ result, onClose }) => {
  const image = REPORT_IMAGE[result.verdict];

  const displayUrl =
    result.url.length > 50 ? result.url.slice(0, 48) + '…' : result.url;

  const rows: Array<{ key: string; label: string; detail: string; status: SignalStatus }> = [
    { key: 'domainAge', ...result.signals.domainAge },
    { key: 'typosquat', ...result.signals.typosquat },
    { key: 'safeBrowsing', ...result.signals.safeBrowsing },
    { key: 'urgency', ...result.signals.urgency },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '421px',
        fontFamily: FONT_FAMILY,
        letterSpacing: FONT_LETTER_SPACING,
      }}
    >
      <img
        src={image}
        alt=""
        style={{ display: 'block', width: '421px', height: 'auto' }}
      />

      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af',
          fontSize: '20px',
          lineHeight: 1,
          padding: 0,
        }}
        aria-label="Close"
      >
        ×
      </button>

      <p
        style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          margin: 0,
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          wordBreak: 'break-all',
          letterSpacing: '0.005em',
        }}
      >
        {displayUrl}
      </p>

      {/* Score + per-signal checklist, positioned in the blank space below
          the "Here's why we think so" text baked into the report image. */}
      <div
        style={{
          position: 'absolute',
          top: '332px',
          left: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        {/* Left: score + heat bar */}
        <div style={{ width: '104px', flexShrink: 0 }}>
          <p
            style={{
              margin: '0 0 2px',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.11em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            Danger score
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '2px',
              margin: '0 0 7px',
            }}
          >
            <span
              style={{
                fontSize: '30px',
                fontWeight: 800,
                lineHeight: 1,
                color: '#111',
              }}
            >
              {result.score}
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1,
                color: '#9ca3af',
                marginLeft: '-2px', // Added more spacing
                letterSpacing: '0.5px' // Optional: adds subtle horizontal spacing between characters
              }}
            >
              / 100
            </span>
      
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, #178800 0%, #d97706 50%, #dc2626 100%)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: `${Math.min(100, Math.max(0, result.score))}%`,
                transform: 'translateX(-50%)',
                width: '2px',
                height: '10px',
                borderRadius: '1px',
                background: '#111',
              }}
            />
          </div>
        </div>

        {/* Right: per-signal checklist */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {rows.map(row => (
            <div key={row.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <div style={{ flexShrink: 0, marginTop: '1px' }}>{STATUS_ICON[row.status]}</div>
              <p style={{ margin: 0, fontSize: '10.5px', lineHeight: 1.3, letterSpacing: '0.06px' }}>
                <span style={{ fontWeight: 600, color: '#111' }}>{row.label}</span>
                <span style={{ color: '#6b7280', marginLeft: '6px' }}>{row.detail}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
