import React from 'react';
import type { ScoredResult } from '../utils/messaging';
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

export const SafetyReport: React.FC<Props> = ({ result, onClose }) => {
  const image = REPORT_IMAGE[result.verdict];

  const displayUrl =
    result.url.length > 50 ? result.url.slice(0, 48) + '…' : result.url;

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
 
    </div>
  );
};
