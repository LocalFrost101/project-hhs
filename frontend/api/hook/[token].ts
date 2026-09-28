// Vercel serverless function — mirrors backend/routers/protect.py hook route.
// Decrypts the token server-side and forwards the payload to the real Discord webhook,
// so the webhook URL never appears in client code.
import { createDecipheriv, createHash } from "crypto";
import { notifyOwner } from "../_owner";

const WEBHOOK_RE = /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+\/?$/;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "POST only" });
  }
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ detail: "WEBHOOK_SECRET is not configured on this deployment" });
  }
  try {
    const raw = Buffer.from(String(req.query.token), "base64url");
    const key = createHash("sha256").update(secret).digest();
    const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(raw.length - 16));
    const url = Buffer.concat([
      decipher.update(raw.subarray(12, raw.length - 16)),
      decipher.final(),
    ]).toString("utf8");
    if (!WEBHOOK_RE.test(url)) {
      return res.status(400).json({ detail: "Invalid token payload" });
    }
    const queryIndex = String(req.url).indexOf("?");
    const query = queryIndex >= 0 ? String(req.url).slice(queryIndex) : "";
    const discord = await fetch(url + query, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body ?? {}),
    });
    const text = await discord.text();
    await notifyOwner("hook_relay", `Token \`${String(req.query.token).slice(0, 10)}…\` → Discord ${discord.status}`);
    return res.status(discord.status).setHeader("Content-Type", "application/json").send(text || "{}");
  } catch {
    return res.status(400).json({ detail: "Invalid or corrupted token" });
  }
}
