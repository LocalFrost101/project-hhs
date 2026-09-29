// Keyless disposable-inbox client (mail.tm, with mail.gw fallback — same API shape).
// Tokens/passwords live in memory only; nothing is persisted.

export interface Inbox {
  id: string;
  address: string;
  token: string;
}

export interface MessageSummary {
  id: string;
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
  from: { address: string; name: string };
}

export interface FullMessage extends MessageSummary {
  text?: string;
  html?: string[];
}

const BASES = ["https://api.mail.tm", "https://api.mail.gw", ""]; // "" = same-origin proxy
let workingBase: string | null = null;

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const bases = workingBase !== null ? [workingBase, ...BASES.filter((b) => b !== workingBase)] : BASES;
  let lastErr: unknown = null;
  for (const base of bases) {
    try {
      const headers = new Headers(init.headers);
      headers.set("Accept", "application/json");
      if (init.body) headers.set("Content-Type", "application/json");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const url = base === "" ? `/api/mail${path}` : `${base}${path}`;
      const res = await fetch(url, { ...init, headers, credentials: "omit" });
      if (!res.ok) throw new Error(`mail service answered ${res.status}`);
      workingBase = base;
      return (res.status === 204 ? undefined : await res.json()) as T;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("mail service unreachable");
}

interface Hydra<T> {
  "hydra:member": T[];
}

// mail.tm content-negotiates: Accept: application/json yields plain arrays, ld+json yields Hydra.
const members = <T,>(d: Hydra<T> | T[]): T[] => (Array.isArray(d) ? d : d["hydra:member"]);

export async function createInbox(): Promise<Inbox> {
  const domains = await request<Hydra<{ domain: string }> | Array<{ domain: string }>>("/domains");
  const domain = members(domains)[0]?.domain;
  if (!domain) throw new Error("No active mail domain right now — retry in a moment.");
  const local = `bd${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const address = `${local}@${domain}`;
  const password = `${crypto.randomUUID()}A9!`;
  await request("/accounts", { method: "POST", body: JSON.stringify({ address, password }) });
  const auth = await request<{ id: string; token: string }>("/token", {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });
  return { id: auth.id, address, token: auth.token };
}

export async function listMessages(token: string): Promise<MessageSummary[]> {
  const data = await request<Hydra<MessageSummary> | MessageSummary[]>("/messages?page=1", {}, token);
  return members(data);
}

export function readMessage(id: string, token: string): Promise<FullMessage> {
  return request<FullMessage>(`/messages/${encodeURIComponent(id)}`, {}, token);
}

export function deleteMessage(id: string, token: string): Promise<void> {
  return request<void>(`/messages/${encodeURIComponent(id)}`, { method: "DELETE" }, token);
}

export function burnAccount(id: string, token: string): Promise<void> {
  return request<void>(`/accounts/${encodeURIComponent(id)}`, { method: "DELETE" }, token);
}

// Email HTML is hostile — display path is plain text only.
export function messageBody(m: FullMessage): string {
  if (m.text) return m.text;
  if (m.html?.length) return m.html.join("\n").replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
  return "(empty body)";
}
