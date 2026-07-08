# Arrête

**Video Demo:** [Watch here](https://vimeo.com/1208136832?share=copy&fl=sv&fe=ci)

**Stop before you spend.** Arrête is a Chrome extension that scans sites as you shop, verifies results on Google Shopping, and makes you pause before making purchases—all to keep you and your money safe on the internet.

---

## What it does

When you land on a product or checkout page, Arrête automatically:

1. **Scores the site** across four signals and shows a danger rating (0–100)
2. **Intervenes when you try to "Add to Cart" or "Place Order"** on high-risk sites, showing a 10-second countdown before you can proceed — giving you a moment to reconsider
3. **Verification** (✓) Arrête places a verification checkmark next to trusted retailers on Google Shopping results.
4. **Lets you manually scan** any site from the popup


## Getting started

### Install Arrête from GitHub Releases

1. **Download the latest release ZIP**
   - Go to [the Arrête GitHub Releases page](https://github.com/Pattuv/arrete/releases/tag/v.1.0.0) and download the latest `arrete-chrome.zip` file.
2. **Extract the ZIP file**
   - Unzip the downloaded file to a folder on your computer.
3. **Load in Chrome**
   1. Go to `chrome://extensions`
   2. Enable **Developer Mode** (toggle in the top-right)
   3. Click **Load unpacked**
   4. Select the extracted `arrete-chrome` folder

4. There is a folder called testspoof. inside is a test scam website to test Arrête's functionality. Try it out! (the main html file to run is index).


### Scoring signals

| Signal | Weight | Data source |
|---|---|---|
| Domain age | 35% | IANA RDAP (free, no key needed) |
| URL similarity / typosquatting | 30% | Levenshtein distance vs. known brand list |
| Google Safe Browsing | 25% | Safe Browsing Lookup API v4 |
| Urgency language | 10% | DOM text pattern matching |

**Risk levels:** Green (0–34) · Yellow (35–64) · Red (65–100)

---

## Tech stack

| Layer | Technology |
|---|---|
| Extension framework | [WXT](https://wxt.dev) (Vite-based, MV3) |
| UI | React 19 + Tailwind CSS v4 |
| Language | TypeScript 5 |
| Build | Vite 8 (via WXT) |
| Manifest | Chrome MV3 |

---

## APIs used

| API | Purpose | Key required |
|---|---|---|
| [IANA RDAP](https://rdap.org) (`rdap.org/domain/:domain`) | Domain registration date lookup | No |
| [Google Safe Browsing v4](https://developers.google.com/safe-browsing/v4) | Known malware check | Yes (free) |

---

## License

MIT
