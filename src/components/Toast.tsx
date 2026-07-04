import React from 'react';
import type { ScoredResult } from '../utils/messaging';
import greenToast from '../assets/toasts/greentoast.png';
import orangeToast from '../assets/toasts/orangetoast.png';
import redToast from '../assets/toasts/redtoast.png';

interface Props {
  result: ScoredResult;
  onExpand: () => void;
  onClose: () => void;
}

const TOAST_IMAGE = {
  green: greenToast,
  yellow: orangeToast,
  red: redToast,
} as const;

export const Toast: React.FC<Props> = ({ result, onExpand, onClose }) => {
  const image = TOAST_IMAGE[result.verdict];

  return (
    <div
      onClick={onExpand}
      role="button"
      style={{ position: 'relative', width: '289px', height: '86px', cursor: 'pointer' }}
    >
      <img src={image} alt="" style={{ display: 'block', width: '289px', height: '86px' }} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: '8px',
          right: '9px',
          width: '16px',
          height: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#111',
          fontSize: '15px',
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
};
