import { useEffect, useState } from "react";

interface ConnectionInfo {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, cb: () => void) => void;
  removeEventListener?: (type: string, cb: () => void) => void;
}

function readConnection() {
  const conn = (navigator as unknown as { connection?: ConnectionInfo }).connection;
  return {
    supported: !!conn,
    type: conn?.type ?? "unknown",
    effectiveType: conn?.effectiveType ?? "unknown",
    downlink: conn?.downlink ?? null,
    rtt: conn?.rtt ?? null,
    saveData: conn?.saveData ?? false,
    online: navigator.onLine,
  };
}

export function useNetworkInfo() {
  const [info, setInfo] = useState(readConnection);

  useEffect(() => {
    const conn = (navigator as unknown as { connection?: ConnectionInfo }).connection;
    const update = () => setInfo(readConnection());
    conn?.addEventListener?.("change", update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      conn?.removeEventListener?.("change", update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return info;
}
