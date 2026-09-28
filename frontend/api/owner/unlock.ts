// Owner unlock — mirrors backend/routers/owner.py. Stateless: no lockout counter on
// serverless, so OWNER_CODE must be long and random.
import { jwtSecret, notifyOwner, signOwnerToken } from "../_owner";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }
  const code = process.env.OWNER_CODE;
  const secret = jwtSecret();
  if (!code || !secret) {
    return res.status(503).json({ detail: "Owner auth is not configured on this deployment" });
  }
  if (String(req.body?.code ?? "") !== code) {
    return res.status(401).json({ detail: "Invalid access code" });
  }
  await notifyOwner("owner_unlock", "Owner panel unlocked");
  return res.json({ token: signOwnerToken(secret), expires_in: 1800 });
}
