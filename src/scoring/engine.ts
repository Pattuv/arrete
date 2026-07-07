import type { ScoredResult, SignalBreakdown, SignalStatus, RiskLevel } from '../utils/messaging';
import { scoreDomainAge } from './domainAge';
import { scoreTyposquat } from './typosquat';
import { scoreSafeBrowsing } from './safeBrowsing';
import { scoreUrgency } from './urgency';

// Signal weights — must sum to 1.0
const WEIGHTS = {
  domainAge: 0.35,
  typosquat: 0.30,
  safeBrowsing: 0.25,
  urgency: 0.10,
} as const;

function verdictFromScore(score: number): RiskLevel {
  if (score >= 65) return 'red';
  if (score >= 35) return 'yellow';
  return 'green';
}

// Same tiers used for every individual signal's checklist status, so a
// sub-score of e.g. 40 always reads as "warn" whether it came from domain
// age, typosquat, or urgency.
function statusFromScore(score: number): SignalStatus {
  if (score >= 65) return 'bad';
  if (score >= 20) return 'warn';
  return 'good';
}

export async function runScoring(
  url: string,
  urgencySignals: string[]
): Promise<ScoredResult> {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  // Use host (hostname + port) as the identity key so that e.g.
  // localhost:5921 and localhost:5922 don't collide in the cache.
  const host = urlObj.host;

  // Run all scorers concurrently
  const [domainAgeResult, typosquatResult, safeBrowsingResult] = await Promise.all([
    scoreDomainAge(hostname),
    Promise.resolve(scoreTyposquat(hostname)),
    scoreSafeBrowsing(url),
  ]);

  const urgencyScore = scoreUrgency(urgencySignals);

  // Weighted composite score
  const rawScore =
    domainAgeResult.score * WEIGHTS.domainAge +
    typosquatResult.score * WEIGHTS.typosquat +
    safeBrowsingResult.score * WEIGHTS.safeBrowsing +
    urgencyScore * WEIGHTS.urgency;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));
  const verdict = verdictFromScore(score);

  // Domain age
  let domainAgeDetail: string;
  if (domainAgeResult.error || domainAgeResult.ageDays === null) {
    domainAgeDetail = 'Registration date unavailable';
  } else {
    const days = domainAgeResult.ageDays;
    if (days < 1) domainAgeDetail = 'Registered today';
    else if (days < 30) domainAgeDetail = `Registered ${days} day${days === 1 ? '' : 's'} ago`;
    else if (days < 365) {
      const months = Math.max(1, Math.round(days / 30));
      domainAgeDetail = `Registered ${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.round(days / 365);
      domainAgeDetail = `Registered ${years} year${years === 1 ? '' : 's'} ago`;
    }
  }
  const domainAge: SignalBreakdown = {
    status: statusFromScore(domainAgeResult.score),
    label: 'Domain age',
    detail: domainAgeDetail,
  };

  // Typosquat / URL similarity
  let typosquatDetail: string;
  if (typosquatResult.distance === 0) {
    typosquatDetail = 'Matches a known retailer';
  } else if (typosquatResult.closestBrand && typosquatResult.score >= 40) {
    typosquatDetail = `Similar to ${typosquatResult.closestBrand}.com`;
  } else {
    typosquatDetail = 'No resemblance to known brands';
  }
  const typosquat: SignalBreakdown = {
    status: statusFromScore(typosquatResult.score),
    label: 'URL similarity',
    detail: typosquatDetail,
  };

  // Google Safe Browsing (binary signal)
  const safeBrowsing: SignalBreakdown = {
    status: safeBrowsingResult.score > 0 ? 'bad' : 'good',
    label: 'Safe Browsing',
    detail:
      safeBrowsingResult.score > 0
        ? `Flagged as ${(safeBrowsingResult.threatType ?? 'a threat').toLowerCase().replace(/_/g, ' ')}`
        : 'Not flagged by Google',
  };

  // Urgency language
  let urgencyDetail: string;
  if (urgencySignals.length === 0) {
    urgencyDetail = 'None detected';
  } else if (urgencySignals.length === 1) {
    urgencyDetail = `"${urgencySignals[0]}"`;
  } else {
    urgencyDetail = `${urgencySignals.length} pressure tactics found`;
  }
  const urgency: SignalBreakdown = {
    status: statusFromScore(urgencyScore),
    label: 'Urgency language',
    detail: urgencyDetail,
  };

  return {
    url,
    domain: host,
    score,
    verdict,
    signals: { domainAge, typosquat, safeBrowsing, urgency },
    timestamp: Date.now(),
  };
}
