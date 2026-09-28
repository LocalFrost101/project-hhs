// Script archive — sources uploaded on obfuscate, stored in Vercel KV with a 30-day TTL.
// GET is owner-gated; POST is open (it's the obfuscator's archive hook).
import { randomUUID } from "crypto";
import { jwtSecret, kvCmd, verifyOwnerToken } from "./_owner";

const TTL_SECONDS = 2592000; // 30 days
const MAX_SOURCE = 200000;

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    const source = String(req.body?.source ?? "");
    if (!source || source.length > MAX_SOURCE) {
      return res.status(400).json({ detail: "Invalid source" });
    }
    const id = randomUUID();
    const ok = await kvCmd("setex", `script:${id}`, TTL_SECONDS, source);
    if (ok === null) {
      return res.status(503).json({ detail: "Script archive requires Vercel KV on this deployment" });
    }
    return res.json({ id, expires_in_days: 30 });
  }

  if (req.method === "GET") {
    const secret = jwtSecret();
    if (!secret) {
      return res.status(503).json({ detail: "Owner auth is not configured on this deployment" });
    }
    const auth = String(req.headers.authorization ?? "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!verifyOwnerToken(token, secret)) {
      return res.status(401).json({ detail: "Invalid or expired token" });
    }
    const keys = (await kvCmd("keys", "script:*")) as string[] | null;
    if (keys === null) {
      return res.status(503).json({ detail: "Script archive requires Vercel KV on this deployment" });
    }
    const scripts = [];
    for (const key of keys.slice(0, 50)) {
      const source = (await kvCmd("get", key)) as string | null;
      if (source !== null) {
        scripts.push({ id: key.slice(7), source, size: source.length, created_at: null });
      }
    }
    return res.json({ scripts, retention_days: 30 });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}
