import type { ScoredResult, ScoreReason, RiskLevel } from '../utils/messaging';
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

export async function runScoring(
  url: string,
  urgencySignals: string[]
): Promise<ScoredResult> {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

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
  const reasons: ScoreReason[] = [];

  // Build reason list — only include signals that contributed meaningfully
  if (safeBrowsingResult.score > 0) {
    reasons.push({
      label: 'Google Safe Browsing alert',
      detail: `Flagged as ${safeBrowsingResult.threatType ?? 'a threat'} by Google Safe Browsing`,
      severity: 'red',
    });
  }

  if (domainAgeResult.score >= 85) {
    const daysText =
      domainAgeResult.ageDays !== null
        ? `${domainAgeResult.ageDays} day${domainAgeResult.ageDays === 1 ? '' : 's'} ago`
        : 'very recently';
    reasons.push({
      label: 'Brand-new domain',
      detail: `Domain was registered ${daysText} — legitimate retailers are rarely this new`,
      severity: domainAgeResult.score >= 85 ? 'red' : 'yellow',
    });
  } else if (domainAgeResult.score >= 40) {
    reasons.push({
      label: 'Recently registered domain',
      detail: `Domain is only ${domainAgeResult.ageDays} days old`,
      severity: 'yellow',
    });
  }

  if (typosquatResult.score >= 75 && typosquatResult.closestBrand) {
    reasons.push({
      label: 'URL closely resembles a known brand',
      detail: `"${urlObj.hostname}" looks very similar to "${typosquatResult.closestBrand}.com" but is not`,
      severity: typosquatResult.score >= 75 ? 'red' : 'yellow',
    });
  } else if (typosquatResult.score >= 40 && typosquatResult.closestBrand) {
    reasons.push({
      label: 'URL resembles a known brand',
      detail: `This domain has similarities to "${typosquatResult.closestBrand}.com"`,
      severity: 'yellow',
    });
  }

  if (urgencyScore >= 65 && urgencySignals.length > 0) {
    reasons.push({
      label: 'Manufactured urgency language',
      detail: `Found ${urgencySignals.length} pressure tactics: "${urgencySignals.slice(0, 2).join('", "')}"`,
      severity: urgencyScore >= 65 ? 'red' : 'yellow',
    });
  } else if (urgencyScore >= 20 && urgencySignals.length > 0) {
    reasons.push({
      label: 'Urgency language detected',
      detail: `"${urgencySignals[0]}"`,
      severity: 'yellow',
    });
  }

  // If score is low but no specific reasons were found
  if (score < 35 && reasons.length === 0) {
    reasons.push({
      label: 'No major risk signals found',
      detail: 'Domain age, URL, and content all appear normal',
      severity: 'green',
    });
  }

  return {
    url,
    domain: hostname,
    score,
    verdict,
    reasons,
    timestamp: Date.now(),
  };
}
