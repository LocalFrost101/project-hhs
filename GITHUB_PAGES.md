# Deploy Blues DET to GitHub Pages

Blues DET is a fully static site (Vite + React build output in `frontend/dist`).
No backend is required — the live scanners run 100% in the browser, and GitHub Pages
serves it over HTTPS, which Web Bluetooth requires.

## Option A — automatic (included workflow)

This repo ships `.github/workflows/deploy.yml`, which builds `frontend/` and publishes it.

1. Push this repository to GitHub (**LocalFrost101/project-hhs**).
2. In the repo: **Settings → Pages → Source → GitHub Actions**.
3. Push any commit to `main` (or run the workflow manually from the Actions tab).
4. Your site appears at **https://localfrost101.github.io/project-hhs/** — watch the Actions tab for the green checkmark on the first run.

The Vite config uses `base: "./"`, so it works under any repo subpath with no extra config.

## Option B — manual

```bash
cd frontend
yarn install
yarn build
```

Upload the contents of `frontend/dist/` to any static host (Pages, Netlify, Vercel, S3…).

## What works where

GitHub Pages is static-only: the device detector and the Lua obfuscator work fully there.
The webhook protector and the Owner tab need the serverless functions in `frontend/api/` —
deploy to Vercel for the full suite (see VERCEL.md). Those panels say so in-app when the
functions aren't reachable.

## Browser support notes

- **BLE radar / device picker**: Chrome, Edge, Opera (HTTPS required). On desktop Chrome,
  enable `chrome://flags/#enable-experimental-web-platform-features` for the continuous
  radar (`requestLEScan`); the device picker works without the flag. Chrome on Android
  supports both.
- **EMF field meter**: requires a magnetometer — most Android phones, virtually no laptops.
- **Safari / Firefox**: no Web Bluetooth; network intel and sensor inventory still work.
