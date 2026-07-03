import React, { useEffect, useState } from 'react';
import wordmark from '../../assets/wordmark.png';
import type { ExtensionStats, ScoredResult, Message } from '../../utils/messaging';

type View = 'dashboard' | 'report';

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function truncateUrl(url: string, max = 38): string {
  return url.length > max ? url.slice(0, max) + '…' : url;
}

// Digit-box counter component (matching mockup style)
const DigitBox: React.FC<{ value: string }> = ({ value }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      background: '#2563eb',
      color: 'white',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: 700,
    }}
  >
    {value}
  </span>
);

const ScannedCounter: React.FC<{ count: number }> = ({ count }) => {
  const digits = count.toString().padStart(2, ' ').split('');
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        border: '1px solid #CBCBCB',
        backgroundColor: '#F7F7F7',
        borderRadius: '8px',
        marginBottom: '12px',
      }}
    >
      <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>Lifetime websites scanned:</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {digits.map((d, i) => (
          d.trim() ? <DigitBox key={i} value={d} /> : null
        ))}
      </div>
    </div>
  );
};

const ReportView: React.FC<{ result: ScoredResult; onBack: () => void }> = ({ result, onBack }) => {
  const verdictColors: Record<string, string> = {
    green: '#16a34a',
    yellow: '#d97706',
    red: '#dc2626',
  };
  const color = verdictColors[result.verdict];

  return (
    <div style={{ padding: '14px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#6b7280',
          padding: 0,
          marginBottom: '10px',
          fontFamily: 'inherit',
        }}
      >
        ← Back
      </button>

      <div
        style={{
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '12px',
        }}
      >
        <p style={{ fontSize: '11px', fontWeight: 700, color, letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>
          {result.verdict === 'green' ? 'Safe' : 'Warning'}
        </p>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#111', marginBottom: '6px' }}>
          {result.verdict === 'green'
            ? 'You may shop freely.'
            : result.verdict === 'yellow'
            ? 'This site is suspicious.'
            : 'This site could be a scam.'}
        </p>
        <p style={{ fontSize: '11px', color: '#6b7280', wordBreak: 'break-all' }}>{result.url}</p>
      </div>

      <p style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Here's why we think so:
      </p>

      {result.reasons.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6', marginBottom: '10px' }}>
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: r.severity === 'red' ? '#dc2626' : r.severity === 'yellow' ? '#d97706' : '#16a34a',
              flexShrink: 0,
              marginTop: '4px',
            }}
          />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>{r.label}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>{r.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const App: React.FC = () => {
  const [stats, setStats] = useState<ExtensionStats | null>(null);
  const [currentScore, setCurrentScore] = useState<ScoredResult | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [manualChecking, setManualChecking] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) setCurrentUrl(tab.url);

      const [statsResp, scoreResp] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_STATS' } satisfies Message) as Promise<Message>,
        chrome.runtime.sendMessage({ type: 'GET_CURRENT_SCORE' } satisfies Message) as Promise<Message>,
      ]);

      if (statsResp?.type === 'STATS_RESPONSE') setStats(statsResp.stats);
      if (scoreResp?.type === 'CURRENT_SCORE_RESPONSE') setCurrentScore(scoreResp.result);
    } catch {
      // fail silently
    }
  }

  async function handleManualCheck() {
    if (manualChecking || !currentUrl) return;
    setManualChecking(true);
    try {
      const response = (await chrome.runtime.sendMessage({
        type: 'MANUAL_CHECK',
        url: currentUrl,
      } satisfies Message)) as Message;

      if (response?.type === 'SCORE_RESPONSE') {
        setCurrentScore(response.result);
        setView('report');
        // Refresh stats
        const statsResp = (await chrome.runtime.sendMessage({ type: 'GET_STATS' } satisfies Message)) as Message;
        if (statsResp?.type === 'STATS_RESPONSE') setStats(statsResp.stats);
      }
    } catch {
      // fail silently
    } finally {
      setManualChecking(false);
    }
  }

  const hasRiskyScore = currentScore && currentScore.verdict !== 'green';

  return (
    <div
      style={{
        width: '420px',
        boxSizing: 'border-box',
        background: '#ffffff',
        border: '1px solid #2563eb',
      }}
    >
      {view === 'report' && currentScore ? (
        <ReportView result={currentScore} onBack={() => setView('dashboard')} />
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={wordmark} alt="Arrête" style={{ height: '22px', display: 'block' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  color: '#111',
                  textTransform: 'uppercase',
                  position: 'relative',
                  top: '3.5px',
                }}
              >
                | Dashboard
              </span>
         
            </div>
            <button
              onClick={() => window.close()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '18px 20px' }}>
            {/* Safety report banner (shown when current site has a risky score) */}
            {hasRiskyScore && (
              <button
                onClick={() => setView('report')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff5f5',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 21h20L12 2z" fill="#dc2626" />
                  <path d="M12 9v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1.1" fill="white" />
                </svg>
                <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                  View this site's safety report →
                </span>
              </button>
            )}

            {/* Estimated savings card */}
            <div
              style={{
                border: '1px solid #CBCBCB',
                backgroundColor: '#F7F7F7',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '14px',
              }}
            >
              <p style={{ fontSize: '15px', color: '#111', marginBottom: '8px', letterSpacing: '-0.05em', fontWeight: 500 }}>
                Estimated savings
              </p>
              <p style={{ fontSize: '52px', fontWeight: 800, color: '#2563eb', lineHeight: 1.05, marginBottom: '8px', letterSpacing: '-0.05em' }}>
                {stats ? formatCurrency(stats.estimatedSavings) : '$0.00'}
              </p>
              <p style={{ fontSize: '15px', color: '#111', letterSpacing: '-0.05em', fontWeight: 500 }}>with Arrête</p>
            </div>

            {/* Scan counter */}
            <ScannedCounter count={stats?.totalScanned ?? 0} />

            {/* Manual check button (shown when no auto-detected score) */}
            {!currentScore && (
              <button
                onClick={handleManualCheck}
                disabled={manualChecking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '18px 12px',
                  background: manualChecking ? '#374151' : '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: manualChecking ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  marginBottom: '10px',
                }}
              >
                {manualChecking ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Checking…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2.5" />
                      <path d="M20 20l-3.5-3.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Check this website's safety
                  </>
                )}
              </button>
            )}

            {/* Current URL footer */}
            {currentUrl && (
              <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', wordBreak: 'break-all' }}>
                Currently visiting {truncateUrl(currentUrl)}
              </p>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
