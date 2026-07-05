/**
 * Google Safe Browsing Lookup API v4.
 * Requires GOOGLE_KEY in .env (see .env.example).
 * Gracefully returns score 0 if no key is configured.
 */

const API_KEY = import.meta.env.GOOGLE_KEY as string | undefined;
const GSB_URL = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

interface SafeBrowsingResult {
  score: number;
  threatType: string | null;
  error?: string;
}

export async function scoreSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  if (!API_KEY) {
    return { score: 0, threatType: null, error: 'No API key configured' };
  }

  try {
    const body = {
      client: { clientId: 'arrete-extension', clientVersion: '0.1.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(`${GSB_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { score: 0, threatType: null, error: `GSB API error: ${response.status}` };
    }

    const data = (await response.json()) as { matches?: Array<{ threatType: string }> };

    if (data.matches && data.matches.length > 0) {
      return { score: 100, threatType: data.matches[0].threatType };
    }

    return { score: 0, threatType: null };
  } catch (err) {
    return {
      score: 0,
      threatType: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
