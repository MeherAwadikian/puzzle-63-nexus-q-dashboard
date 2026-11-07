# Puzzle #63 — "Nexus-Q" dashboard recreation

**Brief (TRW #automate-me-this-puzzle, 2026-03-20):** recreate the "Nexus-Q" dashboard
screenshot in 3 prompts or fewer using a vibe-coding tool (Bolt / v0 / Lovable).

A polished dark-theme operations-intelligence dashboard named **Nexus-Q**:
sidebar nav, top bar, four KPI stat cards (each with a live-drawn sparkline), a combo
revenue/sessions area+line chart, a traffic-source donut, a requests-by-region bar chart,
and a top-accounts data table with health status. Plain HTML/CSS/JS, no build step,
no runtime dependencies. Every chart is hand-drawn SVG computed from the data arrays in
`app.js` — there is no charting library.

## Live

- **Live (GitHub Pages):** https://meherawadikian.github.io/puzzle-63-nexus-q-dashboard/
- **Source:** https://github.com/MeherAwadikian/puzzle-63-nexus-q-dashboard

## Two honest notes on the brief

**1. The exact reference screenshot could not be retrieved this session, so this is a
faithful interpretation, not a pixel-match.** The original "Nexus-Q" screenshot lives in
the TRW chat channel, which requires an authenticated session. The only logged-in TRW
session on this machine is inside the user's *running* Chrome, whose profile is locked by
the live process and was not started with a remote-debugging port, so there is no safe way
to drive it headlessly; a fresh Playwright/Chrome context is not authenticated to TRW.
Rather than stall, this dashboard was built from the product name plus standard modern
SaaS-analytics dashboard conventions (sidebar + top bar + KPI row + charts + table). If the
real reference is retrieved later, compare it against `build/shot-desktop.png` and adjust.

**2. No Bolt / v0 / Lovable account exists on this machine** (confirmed repeatedly across
the series, e.g. puzzles #5 / #10 / #13). The "3 prompts or fewer" framing is about the
vibe-tool workflow; since there is no account, the dashboard was built directly by hand,
the same documented substitution pattern used for every prior design-tool puzzle. The
result is a complete, polished artifact rather than a tool-generated one.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Semantic structure: sidebar, top bar, KPI section, chart cards, table |
| `styles.css` | One token-driven design system (color, spacing scale, radius, type); responsive |
| `app.js` | Demo data + hand-drawn SVG charts (area/line, donut, bars, sparklines) + UI wiring |
| `build/verify.js` | Live Playwright verification (desktop + narrow), writes the screenshots |
| `build/shot-desktop.png`, `build/shot-narrow.png` | Rendered evidence |

## Charts (all hand-drawn SVG, no library)

- **KPI sparklines** — min/max-normalised polyline + gradient area fill, last-point dot.
- **Revenue & sessions** — dual-series combo: MRR as area+line on a left `$k` axis with
  gridlines and month labels, peak sessions as a dashed overlay line, each series scaled to
  its own range so both read clearly.
- **Traffic by source** — donut built from `stroke-dasharray` arc segments around a ring,
  with a centre total and an external legend showing each source's share.
- **Requests by region** — vertical bars with a gradient fill, value labels and category
  labels, drawn against gridlines.

Charts re-render on window resize (rAF-debounced) and use a `viewBox` so they scale fluidly.

## Verified live (not asserted)

`node build/verify.js <url>` drives the **real system Chrome** (`channel:'chrome'`, per the
#61 D:-drive lesson) and checks **13/13**:

- 4 KPI cards + 8 sparkline paths drawn
- area chart drew paths + gridlines, with a real coordinate path
- donut drew its arcs + a 5-row legend
- bar chart drew 6 bars
- table rendered 6 account rows + 6 health pips
- sidebar visible on desktop; off-canvas at 420px with a working hamburger drawer
- bar chart fits inside the narrow viewport (responsive, no horizontal overflow)

## Run locally

```bash
python -m http.server 8763      # then open http://localhost:8763/
# verify (reuses the puzzle-61 Playwright install, drives system Chrome):
PLAYWRIGHT_BROWSERS_PATH=C:\Users\h\.ms-playwright node build/verify.js http://localhost:8763/
```

All data shown is synthetic demo data, rendered entirely client-side. No secrets, no network calls.
