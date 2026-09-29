import { useEffect, useState } from "react";

export type ServerStatus = "checking" | "live" | "static";

// Probes the serverless/API layer once: a JSON answer (even an error) means the
// functions are live; an HTML answer or network failure means static-only hosting.
export function useServerStatus(): ServerStatus {
  const [status, setStatus] = useState<ServerStatus>("checking");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/protect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "" }),
        });
        const text = await res.text();
        let isJson = false;
        try {
          JSON.parse(text);
          isJson = true;
        } catch {
          isJson = false;
        }
        if (alive) setStatus(isJson ? "live" : "static");
      } catch {
        if (alive) setStatus("static");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return status;
}
