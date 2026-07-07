# testspoof — Arrête detection test fixtures

Two self-contained fake shopping sites for manually testing the Arrête
extension's detection signals. **This folder is a standalone QA fixture and
is not part of the extension build** — nothing here is imported by, or
referenced from, `src/`, `wxt.config.ts`, or any other part of the codebase.
It's just static HTML/CSS/JS you load in a browser with the extension
installed.

Both sites clone the "XBOX Wireless Gaming Controller | Robot White" Amazon
listing used to scope this task, but they are tuned to trip a different
amount of Arrête's detectors:

| | `scam-site/` | `suspicious-site/` |
|---|---|---|
| Intent | Trips **every** controllable signal | Trips **few** signals — a borderline/ambiguous page |
| Branding | Blatant typosquat (`amaz0n`) | Generic unbranded reseller (`DealHub Outlet`) |
| Urgency copy | 15+ pressure-tactic phrases + live countdown | Exactly one soft phrase ("Limited time offer") |
| Checkout | Aggressive countdown, "no refunds", crypto-only payment note | Plain, low-key checkout form |

> ⚠️ Both sites are inert: forms don't submit anywhere, "Place Order" just
> shows an alert. Never enter real personal or card data, even locally.

## How Arrête scores a page

From `src/scoring/engine.ts`, the composite 0–100 score is a weighted blend
of four signals (green `0–34`, yellow `35–64`, red `65–100`):

| Signal | Weight | Source | Controllable from a static HTML fixture? |
|---|---|---|---|
| Domain age | 35% | Live RDAP lookup (`rdap.org`) for whatever hostname you load the page from | **No** — depends on real-world domain registration data |
| Typosquat / URL similarity | 30% | Levenshtein distance between the hostname's label and `KNOWN_BRANDS` (`src/utils/brands.ts`) | **Yes** — purely a function of the hostname string, no network needed |
| Google Safe Browsing | 25% | Google Safe Browsing API (only runs if you've set `GOOGLE_KEY` in `.env`) | **No** — and you shouldn't try to get a test page onto Google's real threat list |
| Urgency language | 10% | DOM/text scan for pressure-tactic phrases (`src/scoring/urgency.ts`) | **Yes** — fully controlled by page copy |

Before any scoring happens at all, the content script gates on
`detectShoppingPage()` (`src/detection/shoppingDetector.ts`) — it needs
`>= 2` points from: JSON-LD `Product`/`Offer` schema (+3), an "Add to
Cart"/"Buy Now"-style button (+2), a visible price pattern (+1), or
`og:type=product`/`twitter:card=product` meta tags (+2). Both fixtures clear
this gate (scam-site maxes it out, suspicious-site does the bare minimum),
otherwise the extension won't run on the page at all.

Separately, once a page scores non-green, `detectCheckoutPage()`
(`src/detection/checkoutDetector.ts`) watches for a payment form (card
`autocomplete` attributes, or 2+ checkout-related phrases like "billing
address" / "CVV") and shows the 10-second "hold on" checkout guard. Both
`checkout.html` pages include a realistic card form to trigger this.

**Practical implication:** the two network-dependent signals (domain age +
Safe Browsing = 60% of the weight) can't be faked from static files without
either registering a real domain or standing up a fake RDAP responder — this
fixture intentionally doesn't attempt either of those (out of scope, and
risks giving inconsistent/misleading results). What you *can* fully and
deterministically test locally is:

- **Typosquat scoring** — by making the hostname you load the page from
  resemble (or not resemble) a known brand.
- **Urgency scoring** — purely page-content driven, works from any hostname
  including `localhost`.
- **Shopping-page gating** and **checkout-guard triggering** — both DOM-driven.

See "Expected scores" below for exact numbers.

## Running it

Each site is fully static — no build step. Pick one of these:

### Option A — quick look, no typosquat signal

```bash
node testspoof/serve.mjs scam-site 5001
node testspoof/serve.mjs suspicious-site 5002
```

Then open `http://localhost:5001` / `http://localhost:5002` in a
Chrome/Chromium profile with the Arrête extension loaded (see the main
[README](../README.md) for build/load instructions). The hostname
`localhost` doesn't resemble any known brand, so typosquat will score `0`
on both — you'll mainly be exercising the urgency signal, the shopping-page
gate, and the checkout guard.

### Option B — full local test including typosquat

Typosquat scoring only looks at the hostname string (no network call), so
you can get a real, non-zero typosquat score locally by pointing a
lookalike hostname at your machine:

```bash
# macOS/Linux — requires sudo to edit /etc/hosts
echo "127.0.0.1 amaz0n.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 dealhub-outlet.com" | sudo tee -a /etc/hosts
```

Then:

```bash
node testspoof/serve.mjs scam-site 5001
node testspoof/serve.mjs suspicious-site 5002
```

And visit `http://amaz0n.com:5001` and `http://dealhub-outlet.com:5002`.
**Remove those two lines from `/etc/hosts` once you're done testing** —
don't leave them in permanently.

> Note: the domain-age RDAP lookup fetches `https://rdap.org/domain/<your
> hostname>`, a real external lookup unaffected by your `/etc/hosts` entry
> (that entry only redirects *your machine's* connections to those exact
> hostnames, not rdap.org's connections). Whatever RDAP actually knows about
> `amaz0n.com`/`dealhub-outlet.com` in the real world will be reflected in
> the domain-age signal — it's simply not something this fixture controls.

## Expected scores

Assuming Safe Browsing is unconfigured (the default — contributes `0`
either way) and you're using a hostname RDAP has no data for or that
resolves as a long-registered domain (domain age contributes `0`):

| Signal | scam-site (`amaz0n.com`) | suspicious-site (`dealhub-outlet.com`) |
|---|---|---|
| Domain age (35%) | 0 *(untestable locally)* | 0 *(untestable locally)* |
| Typosquat (30%) | distance 1 from `amazon` → **100** → 30.0 | no resemblance to any brand → **0** → 0.0 |
| Safe Browsing (25%) | 0 | 0 |
| Urgency (10%) | 15+ distinct matches → **100** → 10.0 | 1 match ("limited time offer") → **20** → 2.0 |
| **Total** | **≈ 40 → yellow** | **≈ 2 → green** |

That already shows a clear gradient with zero real-world domain data. Two
things worth trying to see the full picture:

- **Push scam-site into red:** host it on an actual domain that's less than
  ~90 days old (RDAP will then report `score: 65`+ for domain age, adding
  ~23–35 points → total 65–75, red). This is what makes real typosquat scam
  sites red in production — they're almost always thrown up on brand-new
  domains.
- **Push suspicious-site into yellow on its own:** the same trick works even
  without any brand impersonation or urgency copy — a bare page on a
  brand-new, unbranded domain gets roughly `35 (age) + 0 (typosquat) + 0
  (Safe Browsing) + 2 (urgency) ≈ 37`, yellow. This is intentional: it
  demonstrates that domain age alone (35% weight) is enough to flag a
  freshly-registered site as suspicious even if its content looks
  perfectly ordinary.

## Folder structure

```
testspoof/
├── README.md              this file
├── serve.mjs               tiny zero-dependency static file server
├── scam-site/              maximal-signal fixture → yellow locally / red when hosted on a new domain
│   ├── index.html          product page: full JSON-LD schema, ecommerce meta tags,
│   │                       15+ urgency phrases, live countdown timer, typosquat branding
│   ├── checkout.html       payment form (autocomplete cc-number/cc-exp/cc-csc) + countdown
│   └── assets/style.css
└── suspicious-site/        minimal-signal fixture → green locally / borderline-yellow when hosted on a new domain
    ├── index.html          product page: bare-minimum shopping signals, 1 urgency phrase, generic branding
    ├── checkout.html       plain payment form
    └── assets/style.css
```
