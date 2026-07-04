import React, { useRef, useState } from 'react';
import wordmark from '../assets/wordmark.png';

interface Props {
  onComplete: () => void;
}

const pindemo = chrome.runtime.getURL('pindemo.mov');

const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100%',
  padding: '18px 12px',
  background: '#000',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: 'inherit',
  letterSpacing: 'inherit',
};

export const OnboardingCard: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<'pin' | 'complete'>('pin');
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>();

  function handleDone() {
    if (contentRef.current) {
      setContentHeight(contentRef.current.offsetHeight);
    }
    setStep('complete');
  }

  return (
    <>
      <div style={{ padding: '16px 20px 24px' }}>
        <img src={wordmark} alt="Arrête" style={{ height: '22px', display: 'block' }} />
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {step === 'pin' ? (
          <div ref={contentRef}>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#111',
                letterSpacing: '-0.04em',
                textAlign: 'left',
                margin: '0 0 14px',
                lineHeight: 1.4,
              }}
            >
              Pin Arrête to the toolbar for easy access.
            </p>

            <div
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
                lineHeight: 0,
              }}
            >
              <video
                src={pindemo}
                autoPlay
                loop
                muted
                playsInline
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            <button type="button" onClick={handleDone} style={buttonStyle}>
              Done
            </button>
          </div>
        ) : (
          <div
            style={{
              minHeight: contentHeight,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '8px 0 16px',
              }}
            >
              <p
                style={{
                  fontSize: '30px',
                  fontWeight: 500,
                  color: '#111',
                  letterSpacing: '-0.05em',
                  margin: '0 0 10px',
                  lineHeight: 1.3,
                }}
              >
                All set!
              </p>
              <p
                style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: '#111',
                  letterSpacing: '-0.05em',
                  margin: 0,
                  lineHeight: 1.45,
                  maxWidth: '280px',
                }}
              >
                Arrête will automatically detect scams while you shop.
              </p>
            </div>

            <button type="button" onClick={onComplete} style={buttonStyle}>
              Thanks!
            </button>
          </div>
        )}
      </div>
    </>
  );
};
