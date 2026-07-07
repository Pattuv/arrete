import React, { useEffect, useState } from 'react';
import type { ScoredResult } from '../utils/messaging';
import { FONT_FAMILY, FONT_LETTER_SPACING } from '../utils/fonts';
import intervention from '../assets/intervention.png';
import wordmark from '../assets/wordmark.png';

interface Props {
  result: ScoredResult;
  onComplete: () => void;
  onViewReport: () => void;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 10;

// intervention.png is a 1003x466 canvas, but the actual card artwork (white
// card, red 1px border, gray box with icon/"Wait!"/subtext baked in) only
// occupies the top-left 487x466 — the rest is blank canvas. We render the
// image at its native, unscaled size and crop the wrapper to 487x466 so
// nothing is stretched or squeezed, then position the still-missing pieces
// (wordmark, close button, countdown copy, progress bar, action buttons) on
// top using the pixel coordinates measured from that same source image.
const CARD_WIDTH = 487;
const CARD_HEIGHT = 466;
const IMAGE_WIDTH = 1003;
const IMAGE_HEIGHT = 466;

// Gray box interior: x 30–457, y 68–255 in source-image pixels.
const CONTENT_LEFT = 30;
const CONTENT_RIGHT = CARD_WIDTH - 458; // 29
const GRAY_BOX_BOTTOM = 255;

export const CheckoutGuard: React.FC<Props> = ({ result, onComplete, onViewReport, onClose }) => {
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
        position: 'relative',
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        overflow: 'hidden',
        fontFamily: FONT_FAMILY,
        letterSpacing: FONT_LETTER_SPACING,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}
    >
      <img
        src={intervention}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${IMAGE_WIDTH}px`,
          height: `${IMAGE_HEIGHT}px`,
          maxWidth: 'none',
        }}
      />

      {/* Wordmark — covers the plain "Arrête" text baked into the source
          image so we can use the real logo (with its accent chevron) instead. */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '20px',
          width: '110px',
          height: '38px',
          background: 'white',
        }}
      />
      <img
        src={wordmark}
        alt="Arrête"
        style={{ position: 'absolute', top: '21px', left: '28px', height: '22px', width: 'auto' }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: '12px',
          right: '14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af',
          fontSize: '20px',
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>

      {/* Countdown copy — sits in the blank lower portion of the gray box,
          right below the "This site shows signs of pressure tactics." line
          that's already baked into the image. */}
      <p
        style={{
          position: 'absolute',
          top: '190px',
          left: `${CONTENT_LEFT}px`,
          right: `${CONTENT_RIGHT}px`,
          margin: 0,
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        Take a moment before entering your payment information.
        <br />
        You will be able to continue in {secondsLeft} second{secondsLeft !== 1 ? 's' : ''}.
      </p>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          top: `${GRAY_BOX_BOTTOM + 32}px`,
          left: `${CONTENT_LEFT}px`,
          right: `${CONTENT_RIGHT}px`,
          height: '5px',
          borderRadius: '3px',
          background: '#eee',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: '#111',
            borderRadius: '3px',
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Actions */}
      <button
        onClick={onViewReport}
        style={{
          position: 'absolute',
          top: `${GRAY_BOX_BOTTOM + 32 + 5 + 20}px`,
          left: `${CONTENT_LEFT}px`,
          right: `${CONTENT_RIGHT}px`,
          height: '46px',
          background: '#111',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 400,
          fontFamily: 'inherit',
          letterSpacing: 'inherit',
        }}
      >
        View safety report
      </button>

      {done ? (
        <button
          onClick={onComplete}
          style={{
            position: 'absolute',
            top: `${GRAY_BOX_BOTTOM + 32 + 5 + 20 + 46 + 10}px`,
            left: `${CONTENT_LEFT}px`,
            right: `${CONTENT_RIGHT}px`,
            height: '46px',
            background: 'white',
            color: '#111',
            border: '1px solid #111',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 400,
            fontFamily: 'inherit',
            letterSpacing: 'inherit',
          }}
        >
          Continue anyway
        </button>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: `${GRAY_BOX_BOTTOM + 32 + 5 + 20 + 46 + 10}px`,
            left: `${CONTENT_LEFT}px`,
            right: `${CONTENT_RIGHT}px`,
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            color: '#bbb',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 400,
          }}
        >
          Continue anyway ({secondsLeft}s)
        </div>
      )}
    </div>
  );
};
