// Owner-gated token revocation — mirrors backend/routers/owner.py /revoke.
import { jwtSecret, kvCmd, verifyOwnerToken } from "../_owner";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }
  const secret = jwtSecret();
  if (!secret) {
    return res.status(503).json({ detail: "Owner auth is not configured on this deployment" });
  }
  const auth = String(req.headers.authorization ?? "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!verifyOwnerToken(token, secret)) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
  const hash = String(req.body?.token_hash ?? "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return res.status(400).json({ detail: "Invalid token hash" });
  }
  const ok = await kvCmd("setex", `revoked:${hash}`, 2592000, "1");
  if (ok === null) {
    return res.status(503).json({ detail: "Revocation requires Vercel KV on this deployment" });
  }
  return res.json({ revoked: true });
}
