import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Flame, Inbox, MailPlus, RefreshCw, Trash2 } from "lucide-react";
import {
  burnAccount,
  createInbox,
  deleteMessage,
  listMessages,
  messageBody,
  readMessage,
  type FullMessage,
  type Inbox as InboxShape,
  type MessageSummary,
} from "@/lib/mailtm";

const PANEL = "scanlines overflow-hidden rounded-md border border-sky-400/15 bg-[#070b12]";
const SKY_BUTTON =
  "flex items-center justify-center gap-2 rounded-sm bg-sky-400 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#03121d] transition-colors hover:bg-sky-300 disabled:opacity-50";
const GHOST_BUTTON =
  "flex items-center gap-2 rounded-sm border border-slate-700 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:border-sky-400/50 hover:text-sky-300 disabled:opacity-50";

export function TempMail() {
  const [inbox, setInbox] = useState<InboxShape | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [open, setOpen] = useState<FullMessage | null>(null);
  const [openBusy, setOpenBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const inboxRef = useRef<InboxShape | null>(null);
  inboxRef.current = inbox;

  const refresh = useCallback(async () => {
    const box = inboxRef.current;
    if (!box) return;
    try {
      setMessages(await listMessages(box.token));
    } catch {
      /* transient poll failure — next tick retries */
    }
  }, []);

  useEffect(() => {
    if (!inbox) return;
    refresh();
    const t = setInterval(refresh, 7000);
    return () => clearInterval(t);
  }, [inbox, refresh]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setOpen(null);
    setMessages([]);
    try {
      setInbox(await createInbox());
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} — if this is a network/CORS block, retry; the client auto-falls-back between two mail hosts.`
          : "Could not create inbox",
      );
    } finally {
      setBusy(false);
    }
  };

  const openMessage = async (id: string) => {
    if (!inbox) return;
    setOpenBusy(true);
    try {
      setOpen(await readMessage(id, inbox.token));
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, seen: true } : m)));
    } catch {
      /* ignore */
    } finally {
      setOpenBusy(false);
    }
  };

  const removeMessage = async (id: string) => {
    if (!inbox) return;
    await deleteMessage(id, inbox.token).catch(() => {});
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (open?.id === id) setOpen(null);
  };

  const burn = async () => {
    if (!inbox) return;
    await burnAccount(inbox.id, inbox.token).catch(() => {});
    setInbox(null);
    setMessages([]);
    setOpen(null);
  };

  const copyAddress = async () => {
    if (!inbox) return;
    await navigator.clipboard.writeText(inbox.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section id="tempmail" data-testid="tempmail-section" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7 }}
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-400">
          Module 01 // Burner inbox
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">
          A mailbox that never knew you
        </h2>
        <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-slate-400">
          One click mints a real, receiving email address — no signup, no key, no trace. Mail
          arrives live in this tab. Burn it and it never existed.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className={`${PANEL} lg:col-span-5`} data-testid="inbox-control-panel">
          <div className="flex items-center gap-3 border-b border-sky-400/10 px-5 py-4">
            <MailPlus className="h-4 w-4 text-sky-300" />
            <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
              Inbox control
            </h3>
          </div>
          <div className="space-y-4 px-5 py-5">
            {!inbox ? (
              <button
                data-testid="generate-inbox-button"
                onClick={generate}
                disabled={busy}
                className={`${SKY_BUTTON} w-full`}
              >
                {busy ? "Minting…" : "Generate burner inbox"}
              </button>
            ) : (
              <>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  Your temporary address
                </p>
                <div className="flex items-center gap-2">
                  <code
                    data-testid="inbox-address"
                    className="flex-1 overflow-x-auto whitespace-nowrap rounded-sm border border-sky-400/25 bg-[#04060b] px-3 py-2.5 font-mono text-xs font-bold text-sky-300"
                  >
                    {inbox.address}
                  </code>
                  <button
                    data-testid="copy-address-button"
                    onClick={copyAddress}
                    className="rounded-sm border border-slate-700 p-2.5 text-slate-400 transition-colors hover:border-sky-400/50 hover:text-sky-300"
                    aria-label="Copy address"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-sky-300" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button data-testid="inbox-refresh-button" onClick={refresh} className={GHOST_BUTTON}>
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                  <button
                    data-testid="burn-inbox-button"
                    onClick={burn}
                    className="flex items-center gap-2 rounded-sm border border-red-400/40 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-red-300 transition-colors hover:bg-red-400/10"
                  >
                    <Flame className="h-3 w-3" /> Burn inbox
                  </button>
                </div>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-sky-400" />
                  Watching for mail · every 7s
                </p>
              </>
            )}
            {error && (
              <p data-testid="tempmail-error" className="font-mono text-[11px] leading-relaxed text-red-300">
                {error}
              </p>
            )}
            <p className="border-t border-sky-400/10 pt-4 font-mono text-[10px] leading-relaxed text-slate-600">
              Burner inboxes are public by nature — never receive passwords or personal data here.
              The inbox lives only in this tab's memory.
            </p>
          </div>
        </div>

        <div className={`${PANEL} lg:col-span-7`} data-testid="inbox-list-panel">
          <div className="flex items-center gap-3 border-b border-sky-400/10 px-5 py-4">
            <Inbox className="h-4 w-4 text-sky-300" />
            <h3 className="font-heading text-sm font-black uppercase tracking-[0.2em] text-slate-100">
              Incoming
            </h3>
            <span className="ml-auto font-mono text-[10px] text-slate-500">{messages.length} msg</span>
          </div>
          <div className="min-h-[240px]">
            {messages.length === 0 && (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
                <Inbox className="h-6 w-6 text-slate-600" />
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
                  {inbox ? "Empty — send anything to your address" : "Generate an inbox first"}
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={m.id}
                data-testid={`message-row-${i}`}
                className="flex w-full items-start gap-3 border-b border-sky-400/5 px-5 py-4 transition-colors hover:bg-sky-400/5"
              >
                <button onClick={() => openMessage(m.id)} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-2 font-mono text-xs font-bold text-slate-100">
                    {!m.seen && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
                    <span className="truncate">{m.subject || "(no subject)"}</span>
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                    {m.from.address} · {m.intro}
                  </p>
                </button>
                <button
                  data-testid={`message-delete-${i}`}
                  onClick={() => removeMessage(m.id)}
                  className="rounded-sm border border-slate-800 p-1.5 text-slate-600 transition-colors hover:border-red-400/40 hover:text-red-300"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          {openBusy && <p className="px-5 py-3 font-mono text-[10px] text-slate-500">Opening…</p>}
          {open && (
            <div data-testid="message-reader" className="border-t border-sky-400/10 px-5 py-5">
              <p className="font-mono text-xs font-bold text-slate-100">{open.subject || "(no subject)"}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">from {open.from.address}</p>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-sm border border-slate-800 bg-[#04060b] p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                {messageBody(open)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
