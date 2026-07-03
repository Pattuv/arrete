import { KNOWN_BRANDS, levenshtein, extractLabel } from '../utils/brands';

interface TyposquatResult {
  score: number;
  closestBrand: string | null;
  distance: number;
}

export function scoreTyposquat(hostname: string): TyposquatResult {
  const label = extractLabel(hostname);

  // Exact match with a known brand → not a typosquat
  if (KNOWN_BRANDS.includes(label)) {
    return { score: 0, closestBrand: label, distance: 0 };
  }

  let minDistance = Infinity;
  let closestBrand: string | null = null;

  for (const brand of KNOWN_BRANDS) {
    // Skip brands where the length difference is too large to ever match
    if (Math.abs(label.length - brand.length) > 4) continue;

    const dist = levenshtein(label, brand);
    if (dist < minDistance) {
      minDistance = dist;
      closestBrand = brand;
    }
  }

  // Map distance to score
  let score = 0;
  if (minDistance === 1) score = 100;       // one-char typo: very suspicious
  else if (minDistance === 2) score = 75;   // two-char diff: suspicious
  else if (minDistance === 3) score = 40;   // plausible similarity
  else score = 0;

  return { score, closestBrand, distance: minDistance };
}
