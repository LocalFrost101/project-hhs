# Deploy Blues DET to Vercel (full suite)

Vercel runs both the static site and the serverless functions in `frontend/api/`,
which power the webhook protector. This is the recommended deployment.

## Steps

1. Push this repo to GitHub (Save to GitHub in Emergent).
2. Go to **vercel.com/new** and import **LocalFrost101/project-hhs**.
3. Set **Root Directory** to `frontend` (click Edit next to the root). Vercel
   auto-detects Vite — build command and output directory fill themselves in.
4. Add environment variables:
   - `WEBHOOK_SECRET` — any long random string (`openssl rand -hex 32`) — encrypts protected webhooks
   - `OWNER_CODE` — your secret access code for the Owner tab (make it long and random)
   - `OWNER_WEBHOOK` — your own Discord webhook URL — receives every event notification
     (webhook protected, hook relay used, owner panel unlocked)
   - `OWNER_JWT_SECRET` — optional; defaults to `WEBHOOK_SECRET`
   - **Vercel KV** (Storage tab → Create Database → KV → connect to project): powers the
     persistent brute-force lockout, token revocation, and the 30-day script archive.
     Without KV those three degrade gracefully — the site still works, those features
     answer with a clear "requires Vercel KV" message.
5. Deploy. Your site goes live at `https://<project>.vercel.app`.

## How the protector works

- `POST /api/protect { "url": "<discord webhook>" }` encrypts the webhook URL with
  AES-256-GCM using `WEBHOOK_SECRET` and returns an opaque proxy URL:
  `https://<project>.vercel.app/api/hook/<token>`.
- Your scripts call the proxy URL. The function decrypts the token in memory and
  forwards the payload to Discord. The real webhook URL never appears in client
  code, and the token is useless without the secret.
- Rotating `WEBHOOK_SECRET` invalidates every previously issued token.

## Notes

- The same endpoints also exist in the FastAPI backend (`backend/routers/protect.py`)
  with an identical token format, so the Emergent preview works too.
- GitHub Pages is a static-only alternative: detector + obfuscator work there,
  the protector does not (see GITHUB_PAGES.md).
