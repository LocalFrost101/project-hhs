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

## Implemented (2026-09-28, part 2 — security suite)
- **Webhook Protector** (`#protector`): Discord webhook URL → AES-256-GCM encrypted server-side
  (key = SHA-256 of WEBHOOK_SECRET env) → opaque `/api/hook/<token>` proxy URL; hook route decrypts
  in memory and forwards payloads to Discord (query passthrough, status passthrough). Implemented
  twice with identical token format: FastAPI `backend/routers/protect.py` (Emergent preview) and
  Vercel functions `frontend/api/protect.ts` + `frontend/api/hook/[token].ts`. UI also has a
  client-side leak scanner (finds exposed webhook URLs in pasted code) and a webhook inspector
  (validates against Discord's API, shows name/guild/channel/avatar).
- **Lua Obfuscator** (`#obfuscator`): browser-side engine `src/lib/obfuscate.ts` on luaparse.
  Vault mode: whole-script additive cipher + `loadstring or load` bootstrap (works with any Lua
  dialect incl. Luau). Deep mode: string encryption (byte-table + string.char decoder), scope-aware
  local renaming (controlled AST traversal), number mutation (int → hex arithmetic), comment
  stripping (string-aware scanner). luaparse 0.3.x quirk: literal `.value` is null — decoded from
  `.raw` with a conservative escape decoder (skips \x/\ddd/\u escapes rather than mis-decoding).
- Verified: vitest + fengari (real Lua 5.3 VM in Node) — deep and vault outputs execute
  byte-identically to source; strings/locals provably hidden. Protect endpoint verified through the
  public URL (token issued; forwarding confirmed by Discord's own "Unknown Webhook" 404 response;
  invalid URLs rejected with 400).
- Vercel deploy path: `frontend/vercel.json` (SPA rewrite), functions auto-detected from
  `frontend/api/`, guide in VERCEL.md (root=frontend, WEBHOOK_SECRET env).

## Implemented (2026-09-28, part 3 — hardened vault + owner tab)
- **Vault v2 "hard scramble"**: position-keyed additive byte cipher (`_K` + `_M` multiplier),
  WeAreDevs-style `return(function() ... end)()` loader, optional ×2 nested vault
  (`obfuscateLua(src, opts, layers)`). Banner: `BLUES DET VAULT v2 · hardened scramble`.
- **Deobfuscator** (`deobfuscateVault`): reverses v1/v2 vault layers (loops until no `_D`
  pattern) + deep-mode `__S` string tables (byte-exact Lua re-quoting). Returns null on
  foreign code.
- **Owner tab** (`#owner`, amber "classified" theme): access-code gate → POST
  `/api/owner/unlock` → 30-min HS256 JWT (Bearer, memory-only, never persisted);
  5 fails/IP = 15-min lockout (FastAPI in-memory). Panels: vault deobfuscator + activity
  log (Mongo `owner_logs`, newest 50) + Discord-notify status. Lock button clears session.
- **Owner notifications**: every event (webhook_protected, hook_relay, owner_unlock) logged
  to Mongo AND posted as a Discord embed to `OWNER_WEBHOOK` when set. Identical behavior in
  FastAPI (lib/ownerlog.py) and Vercel functions (api/_owner.ts + owner/unlock.ts +
  owner/logs.ts — manual HMAC-SHA256 JWT, byte-compatible with pyjwt).
- Env: OWNER_CODE, OWNER_JWT_SECRET (falls back to WEBHOOK_SECRET), OWNER_WEBHOOK.
- Verified: curl — wrong code 401, no token 401, right code → JWT → logs 200 with Mongo
  history; vitest 6/6 (double vault executes identically in fengari VM; deobfuscator
  recovers single/double vault + deep strings; rejects foreign code); browser pass —
  multivault 242B→4249B, wrong-code error shown, unlock → panel, deob recovered source.

## Implemented (2026-09-28, part 4 — flattening, revocation, archive, KV lockout)
- **Control-flow flattening** (`flattenChunkFlow`): top-level statements become blocks in a
  shuffled `while` + `if/elseif` state dispatcher with random state IDs; top-level locals are
  lifted into a prelude so scope survives; execution order preserved by explicit state chaining.
  Safety rails: skips on goto/labels, <2 statements, or shadowed duplicate local names.
  Composes: deep → flatten → vault stack all in one run. Verified in fengari: identity on
  samples incl. top-level return, and deep+flatten+double-vault composition.
- **Token revocation**: owner clicks "Revoke token" on a webhook_protected log row →
  POST /api/owner/revoke {token_hash} (owner-gated) → Mongo `revoked_tokens` (unique idx) /
  Vercel KV `revoked:<hash>` (30-day) → hook route answers 403 "Token revoked by owner".
  Verified end-to-end with curl (revoke → 403).
- **Script archive**: every obfuscate submission POSTs source to /api/scripts → Mongo
  `owner_scripts` with TTL index (expires_at, 30 days) / Vercel KV setex. Owner panel lists
  archives with one-click .lua download. UI discloses archiving (honesty fix).
- **Vercel KV lockout**: owner/unlock does INCR lockout:<ip> + EXPIRE 900, >5 → 429, DEL on
  success. Zero-dep Upstash REST client (kvCmd) in api/_owner.ts; everything degrades
  gracefully (null → feature off with clear 503) when KV env vars are absent.
- Verified: 9/9 vitest, typecheck clean, curl chain (upload → list → revoke → 403),
  browser pass (flatten run, owner unlock, revoke buttons, archive panel).

## Implemented (2026-09-28, part 5 — deployment clarity)
- `useServerStatus` probe + `ServerStatusBanner` in Protector and Owner sections: auto-detects
  whether serverless functions are reachable (JSON probe of /api/protect) and shows either
  "SERVER MODULES LIVE" or a "STATIC DEPLOYMENT" explainer pointing to Vercel — kills the
  "nothing works" confusion on GitHub Pages.
- Protector error handling now distinguishes server-side detail errors (e.g. WEBHOOK_SECRET
  missing) from static-host unreachability, with the right guidance for each.
- Modules renumbered in page order: 01 Detector · 02 Protector · 03 Obfuscator · 04 Owner ·
  05 Capability matrix · 06 Reality check/deploy.
- kvCmd accepts both KV_REST_API_* and UPSTASH_REDIS_REST_* env names (Vercel sunset KV in
  favor of the Upstash marketplace integration; VERCEL.md updated).

## Implemented (2026-09-29, part 6 — full remake into independent sections)
- **Detector module removed** (dead on iOS) — site is now: 01 Burner Inbox · 02 Webhook
  Protector · 03 Lua Obfuscator · 04 Owner · 05 Capabilities · 06 Deploy. Hero rebranded to
  "EVERYTHING. PROTECTED." toolkit copy; nav, marquee, bento, footer all re-themed.
- **Burner inbox** (mail.tm keyless API, playbook-driven): create/refresh/read/delete/burn,
  7s polling, plain-text-only rendering (email HTML treated as hostile). mail.tm
  content-negotiation quirk handled (plain-array vs Hydra responses). CORS fallback chain:
  api.mail.tm → api.mail.gw → same-origin proxy (/api/mail/* on FastAPI + Vercel function).
  Verified: real inbox minted in the browser (bd…@uberip.com) and full proxy chain via script.
- **Protector simplified** to protect → protected link, plus **canary tripwire**: GET on
  /api/hook/<token> (browser probe) → owner notified instantly, snooper sees 404. Verified:
  intrusion_attempt lands in the owner log.
- **Obfuscator v2**: paste / upload .lua/.txt / load-from-URL inputs; junk-code injection layer
  (decoy locals, parse-verified, never after top-level return); view-script toggle + download
  .lua on output. 11/11 vitest incl. junk and full-stack composition in the Lua VM.
- **Owner tab rebuilt** as a tabbed command deck (Activity / Scripts / Deobfuscator) with
  counts, refresh, lock, notify status, revoke buttons, .lua downloads.

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
