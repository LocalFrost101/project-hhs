// Owner logs — serverless deploys are stateless, so history streams to the owner's
// Discord via OWNER_WEBHOOK instead of a database.
import { jwtSecret, verifyOwnerToken } from "../_owner";

export default function handler(req: any, res: any) {
  const secret = jwtSecret();
  if (!secret) {
    return res.status(503).json({ detail: "Owner auth is not configured on this deployment" });
  }
  const auth = String(req.headers.authorization ?? "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!verifyOwnerToken(token, secret)) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
  return res.json({
    logs: [],
    notify: !!process.env.OWNER_WEBHOOK,
    note: "Serverless deploys are stateless — every event streams live to your OWNER_WEBHOOK Discord channel.",
  });
}
