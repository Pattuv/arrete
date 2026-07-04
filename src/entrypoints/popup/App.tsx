import React, { useEffect, useState } from 'react';
import wordmark from '../../assets/wordmark.png';
import type { ExtensionStats, ScoredResult, Message } from '../../utils/messaging';
import { hasShownOnboarding, markOnboardingShown } from '../../storage/stats';
import { OnboardingCard } from '../../components/OnboardingCard';
import { SafetyReport } from '../../components/SafetyReport';
import { FONT_FAMILY, FONT_LETTER_SPACING } from '../../utils/fonts';

type View = 'onboarding' | 'dashboard' | 'report';

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

const VERDICT_BANNER: Record<
  string,
  { bg: string; border: string; text: string; label: string; icon: React.ReactNode }
> = {
  green: {
    bg: '#e8f3e6',
    border: '#97c98c',
    text: '#178800',
    label: "This site is safe — view report →",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#178800" />
        <path d="M7.5 12.5l3 3 6-6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  yellow: {
    bg: '#fffbeb',
    border: '#fcd34d',
    text: '#d97706',
    label: "This site is suspicious — view report →",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 21h20L12 2z" fill="#d97706" />
        <path d="M12 9v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.1" fill="white" />
      </svg>
    ),
  },
  red: {
    bg: '#fff5f5',
    border: '#fca5a5',
    text: '#dc2626',
    label: "This site could be a scam — view report →",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 21h20L12 2z" fill="#dc2626" />
        <path d="M12 9v5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1.1" fill="white" />
      </svg>
    ),
  },
};

export const App: React.FC = () => {
  const [stats, setStats] = useState<ExtensionStats | null>(null);
  const [currentScore, setCurrentScore] = useState<ScoredResult | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [manualChecking, setManualChecking] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const shown = await hasShownOnboarding();
      setView(shown ? 'dashboard' : 'onboarding');
      setReady(true);
      if (shown) loadData();
    })();
  }, []);

  async function handleOnboardingComplete() {
    await markOnboardingShown();
    setView('dashboard');
    loadData();
  }

  async function loadData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url ?? '';
      if (url) setCurrentUrl(url);

      const requests: Promise<Message>[] = [
        chrome.runtime.sendMessage({ type: 'GET_STATS' } satisfies Message) as Promise<Message>,
      ];
      if (url) {
        requests.push(
          chrome.runtime.sendMessage({ type: 'GET_SCORE_FOR_URL', url } satisfies Message) as Promise<Message>
        );
      }

      const [statsResp, scoreResp] = await Promise.all(requests);

      if (statsResp?.type === 'STATS_RESPONSE') setStats(statsResp.stats);
      if (scoreResp?.type === 'CURRENT_SCORE_RESPONSE') setCurrentScore(scoreResp.result);
    } catch {
      // fail silently
    }
  }

  // Opens the safety report for the current site — reusing the cached score
  // if this domain was already scanned (automatically or manually) so the
  // report is always consistent, never a freshly-recomputed "random" result.
  async function handleCheckOrViewReport() {
    if (currentScore) {
      setView('report');
      return;
    }
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

  if (!ready) return null;

  if (view === 'onboarding') {
    return (
      <div style={{ width: '420px', boxSizing: 'border-box', background: '#ffffff', border: '1px solid #000' }}>
        <OnboardingCard onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '420px',
        boxSizing: 'border-box',
        background: '#ffffff',
        position: 'relative',
      }}
    >
      {/* The dashboard always stays mounted underneath — the report is a
          floating overlay on top of it, exactly like it appears on the page
          when a toast is expanded, not a separate in-flow "view". */}
      {view === 'report' && currentScore && (
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
          <SafetyReport
            result={currentScore}
            onClose={() => setView('dashboard')}
          />
        </div>
      )}

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
        </div>
        <button
          onClick={() => window.close()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '24px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '18px 20px' }}>
            {/* Safety report indicator — shown whenever the current site has
                already been scanned (auto or manual), colored to its verdict */}
            {currentScore && (
              <button
                onClick={handleCheckOrViewReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '10px 12px',
                  background: VERDICT_BANNER[currentScore.verdict].bg,
                  border: `1px solid ${VERDICT_BANNER[currentScore.verdict].border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                {VERDICT_BANNER[currentScore.verdict].icon}
                <span style={{ fontSize: '13px', color: VERDICT_BANNER[currentScore.verdict].text, fontWeight: 600 }}>
                  {VERDICT_BANNER[currentScore.verdict].label}
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

            {/* Manual check button (shown when the current site hasn't been scanned yet) */}
            {!currentScore && (
              <button
                onClick={handleCheckOrViewReport}
                disabled={manualChecking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '18px 12px',
                  background: manualChecking ? '#333' : '#000',
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
