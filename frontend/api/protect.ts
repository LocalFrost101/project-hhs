// Vercel serverless function — mirrors backend/routers/protect.py (same token format).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createCipheriv, createHash, randomBytes } from "crypto";
import { notifyOwner } from "./_owner";

const WEBHOOK_RE = /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+\/?$/;

// Vercel compiles api/*.ts with its own toolchain; keep handler loosely typed.
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({ detail: "WEBHOOK_SECRET is not configured on this deployment" });
  }
  const url = String(req.body?.url ?? "").trim();
  if (!WEBHOOK_RE.test(url)) {
    return res.status(400).json({ detail: "Not a valid Discord webhook URL" });
  }
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(url, "utf8"), cipher.final(), cipher.getAuthTag()]);
  const token = Buffer.concat([iv, ciphertext]).toString("base64url");
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers.host;
  await notifyOwner("webhook_protected", `New proxy issued · token \`${token.slice(0, 10)}…\``);
  return res.json({ token, proxy_url: `${proto}://${host}/api/hook/${token}` });
}
