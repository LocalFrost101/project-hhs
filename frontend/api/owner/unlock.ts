// Owner unlock — mirrors backend/routers/owner.py. Persistent brute-force lockout via
// Vercel KV: 5 failed codes per IP = 15-minute lock (degrades gracefully without KV,
// so keep OWNER_CODE long and random).
import { jwtSecret, kvCmd, notifyOwner, signOwnerToken } from "../_owner";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }
  const code = process.env.OWNER_CODE;
  const secret = jwtSecret();
  if (!code || !secret) {
    return res.status(503).json({ detail: "Owner auth is not configured on this deployment" });
  }

  const ip = String(req.headers["x-forwarded-for"] ?? "unknown").split(",")[0].trim();
  const lockKey = `lockout:${ip}`;
  const attempts = (await kvCmd("incr", lockKey)) as number | null;
  if (attempts !== null) {
    if (attempts === 1) await kvCmd("expire", lockKey, 900);
    if (attempts > 5) {
      return res.status(429).json({ detail: "Too many attempts — locked for 15 minutes" });
    }
  }

  if (String(req.body?.code ?? "") !== code) {
    return res.status(401).json({ detail: "Invalid access code" });
  }
  if (attempts !== null) await kvCmd("del", lockKey);
  await notifyOwner("owner_unlock", "Owner panel unlocked");
  return res.json({ token: signOwnerToken(secret), expires_in: 1800 });
}
