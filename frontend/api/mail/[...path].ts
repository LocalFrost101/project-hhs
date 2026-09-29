// Thin pass-through to the keyless disposable-mail API (mirrors backend/routers/mail.py)
// so browser CORS can't block the burner inbox on the Vercel deployment.
const UPSTREAM = "https://api.mail.tm";

export default async function handler(req: any, res: any) {
  const segs = req.query.path;
  const path = Array.isArray(segs) ? segs.join("/") : String(segs ?? "");
  const queryIndex = String(req.url).indexOf("?");
  const query = queryIndex >= 0 ? String(req.url).slice(queryIndex) : "";

  const headers: Record<string, string> = { Accept: "application/json" };
  if (req.headers.authorization) headers.Authorization = String(req.headers.authorization);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  if (hasBody) headers["Content-Type"] = "application/json";

  try {
    const resp = await fetch(`${UPSTREAM}/${path}${query}`, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });
    const text = await resp.text();
    return res.status(resp.status).setHeader("Content-Type", "application/json").send(text || "{}");
  } catch {
    return res.status(502).json({ detail: "mail upstream unreachable" });
  }
}
