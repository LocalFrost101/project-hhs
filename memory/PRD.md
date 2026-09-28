# PRD — Blues DET

## Original problem statement
"Help me make a signal jammer website that I can use in GitHub." Pivoted by user (2026-09-28) to:
a **real, working device-detector website called "Blues DET"**, hosted on GitHub Pages, that detects
nearby hidden devices and identifies what kind of device each is, with Wi-Fi awareness.

## Product truth (hard constraints)
- Browsers cannot scan Wi-Fi SSIDs or enumerate LAN devices — the site states this honestly.
- Real, working modules (100% client-side, zero backend):
  1. **BLE Radar** — Web Bluetooth `requestLEScan` continuous sweep + `requestDevice` picker fallback.
     Devices classified by signature bank (40+ rules: trackers, cameras, audio, wearables, phones,
     smart-home, vehicles) with risk rating, RSSI signal bars, estimated distance, last-seen.
  2. **EMF Field meter** — Generic Sensor `Magnetometer` (Android Chrome), anomaly delta vs baseline.
  3. **Network Intel** — Network Information API: link type, effectiveType, downlink, RTT, online state.
  4. **Sensor Inventory** — `getUserMedia` + `enumerateDevices` listing this device's cameras/mics.

## Architecture
- Frontend-only static build: Vite + React 19 + TS, Tailwind v4, motion (framer), lenis smooth scroll.
- `vite.config.ts` uses `base: "./"` + `App.tsx` route `path="*"` → works under any GH Pages subpath.
- Deploy: `.github/workflows/deploy.yml` (builds `frontend/`, publishes via actions/deploy-pages).
  Guide: `/app/GITHUB_PAGES.md`.
- Backend (FastAPI + Mongo) retained only from template; the site does not depend on it.

## Implemented (2026-09-28)
- Kinetic hero: masked line-by-line headline reveal, live radar canvas (canvas 2D sweep, blips
  driven by real BLE devices when scanning), parallax product image, status badge.
- Editorial marquee, detection deck (BLE radar + network + EMF + inventory), capability bento,
  compatibility/reality-check section, 3-step GitHub Pages deploy card, footer with live UTC clock.
- Brand: Blues DET logo mark (SVG, also favicon), obsidian + phosphor-blue tactical aesthetic,
  Outfit display + JetBrains Mono data type.

## Verification done
- `yarn typecheck` clean; `yarn build` clean (dist ~148 kB gzip JS).
- API smoke via public URL: GET /api/ + POST /api/status OK.
- Browser pass via public URL: hero reveal, radar animation, nav anchor scroll, scanner panels,
  unsupported-browser fallback note (headless Chromium has no Bluetooth), footer clock.

## Personas
- Privacy-conscious traveler sweeping a hotel/rental for trackers & cameras.
- Tinkerer wanting a zero-install recon dashboard on their phone.

## Backlog
- P1: mDNS/Wi-Fi companion native app deep-link; BLE export log (CSV/JSON); watchlist alerts
  (sound/vibrate when a high-risk signature appears).
- P2: Camera-glint helper mode (torch + viewfinder overlay); PWA install + offline.
- P3: Multi-language, custom signature editor.
