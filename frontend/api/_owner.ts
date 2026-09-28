// Shared owner-auth helpers for Vercel serverless functions.
// Token format is a standard HS256 JWT — byte-compatible with the FastAPI owner router.
import { createHmac } from "crypto";

const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");

export function jwtSecret(): string | null {
  return process.env.OWNER_JWT_SECRET || process.env.WEBHOOK_SECRET || null;
}

export function signOwnerToken(secret: string): string {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ sub: "owner", type: "access", exp: Math.floor(Date.now() / 1000) + 1800 });
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function verifyOwnerToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const sig = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest("base64url");
  if (sig !== parts[2]) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload.sub === "owner" && typeof payload.exp === "number" && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function notifyOwner(event: string, detail: string): Promise<void> {
  const hook = process.env.OWNER_WEBHOOK;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `BLUES DET · ${event}`,
            description: detail,
            color: 3716088,
            footer: { text: new Date().toISOString() },
          },
        ],
      }),
    });
  } catch {
    /* notifications are best-effort */
  }
}
