/**
 * Checks domain registration date via IANA RDAP protocol.
 * RDAP is a free, standardized replacement for WHOIS — no API key required.
 */

interface DomainAgeResult {
  score: number;
  ageDays: number | null;
  registrationDate: string | null;
  error?: string;
}

function extractRegistrationDate(rdapData: Record<string, unknown>): string | null {
  const events = rdapData['events'] as Array<{ eventAction: string; eventDate: string }> | undefined;
  if (!Array.isArray(events)) return null;

  const reg = events.find(
    e => e.eventAction === 'registration' || e.eventAction === 'registered'
  );
  return reg?.eventDate ?? null;
}

function ageToDays(isoDate: string): number {
  const registered = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - registered) / (1000 * 60 * 60 * 24));
}

function ageDaysToScore(days: number): number {
  if (days < 7) return 100;
  if (days < 30) return 85;
  if (days < 90) return 65;
  if (days < 180) return 40;
  if (days < 365) return 20;
  return 0;
}

export async function scoreDomainAge(hostname: string): Promise<DomainAgeResult> {
  try {
    // Extract just the registrable domain (e.g. "example.com" from "www.sub.example.com")
    const parts = hostname.split('.');
    const registrableDomain =
      parts.length >= 2 ? parts.slice(-2).join('.') : hostname;

    const response = await fetch(
      `https://rdap.org/domain/${encodeURIComponent(registrableDomain)}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      return { score: 0, ageDays: null, registrationDate: null, error: 'RDAP lookup failed' };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const regDate = extractRegistrationDate(data);

    if (!regDate) {
      return { score: 0, ageDays: null, registrationDate: null, error: 'No registration date' };
    }

    const ageDays = ageToDays(regDate);
    return {
      score: ageDaysToScore(ageDays),
      ageDays,
      registrationDate: regDate,
    };
  } catch (err) {
    return {
      score: 0,
      ageDays: null,
      registrationDate: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
