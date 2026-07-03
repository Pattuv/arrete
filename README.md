# Arrête

A Chrome extension that protects you from shopping scams and suspicious sites.

## Features

- **Automatic detection** — silently scans product pages and shows a verdict badge (green / yellow / red) in the top-right corner
- **Multi-signal risk scoring** — domain age (RDAP), typosquat similarity to known brands, Google Safe Browsing, and urgency language detection
- **Expandable Safety Report** — ticket-style receipt showing exactly why a site was flagged
- **Checkout friction** — on high-risk sites, temporarily disables the checkout button with a 10-second countdown when a payment form is detected
- **Dashboard popup** — estimated savings, lifetime sites scanned, manual site check
- **Google Shopping badges** — verified checkmark next to listings from trusted retailers

## Tech Stack

- [WXT](https://wxt.dev) — Chrome Extension MV3 framework
- React 19 + TypeScript
- Tailwind CSS v4
- Shadow DOM isolation for page overlays

## Setup

```bash
# Install dependencies
npm install

# Generate extension icons
npm run generate-icons

# Development (hot-reload)
npm run dev

# Production build
npm run build
```

Load the unpacked extension from `.output/chrome-mv3` in `chrome://extensions` (enable Developer Mode first).

## Optional: Google Safe Browsing API

For phishing/malware detection, add a [Google Safe Browsing API key](https://developers.google.com/safe-browsing/v4/get-started) (free):

```bash
cp .env.example .env
# Edit .env and set VITE_SAFE_BROWSING_KEY=your_key_here
```

The extension works without it — the other three signals still produce meaningful scores.

## Risk Score Weights

| Signal | Weight | Method |
|--------|--------|--------|
| Domain age | 35% | IANA RDAP (free, no key) |
| Typosquat similarity | 30% | Levenshtein vs 80+ known brands |
| Google Safe Browsing | 25% | GSB Lookup API v4 (optional key) |
| Urgency language | 10% | DOM pattern scan |

Verdict tiers: 🟢 Green `0–34` · 🟡 Yellow `35–64` · 🔴 Red `65–100`
