/// <reference types="web-bluetooth" />
import { useCallback, useEffect, useRef, useState } from "react";
import type { DetectedDevice } from "@/lib/detect";

export type ScanState = "idle" | "scanning" | "error" | "unsupported";

const upsert = (map: Map<string, DetectedDevice>, next: DetectedDevice) => {
  const prev = map.get(next.id);
  map.set(next.id, prev ? { ...next, count: prev.count + 1 } : next);
};

export function useBleScan() {
  const supported = typeof navigator !== "undefined" && !!navigator.bluetooth;
  const [state, setState] = useState<ScanState>(supported ? "idle" : "unsupported");
  const [devices, setDevices] = useState<DetectedDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scanRef = useRef<BluetoothLEScan | null>(null);
  const mapRef = useRef(new Map<string, DetectedDevice>());

  useEffect(() => {
    if (!supported) return;
    const bt = navigator.bluetooth;
    const onAd = (ev: BluetoothAdvertisingEvent) => {
      upsert(mapRef.current, {
        id: ev.device.id,
        name: ev.device.name ?? ev.name ?? "",
        rssi: typeof ev.rssi === "number" ? ev.rssi : null,
        uuids: (ev.uuids ?? []).map(String),
        lastSeen: Date.now(),
        count: 1,
      });
      setDevices(Array.from(mapRef.current.values()).sort((a, b) => b.lastSeen - a.lastSeen));
    };
    bt.addEventListener("advertisementreceived", onAd);
    return () => bt.removeEventListener("advertisementreceived", onAd);
  }, [supported]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const scan = await navigator.bluetooth.requestLEScan({
        acceptAllAdvertisements: true,
        keepRepeatedDevices: true,
      });
      scanRef.current = scan;
      setState("scanning");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Scan request was blocked by the browser.");
    }
  }, []);

  const stop = useCallback(() => {
    scanRef.current?.stop();
    scanRef.current = null;
    setState((s) => (s === "unsupported" ? s : "idle"));
  }, []);

  const pick = useCallback(async () => {
    setError(null);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"],
      });
      upsert(mapRef.current, {
        id: device.id,
        name: device.name ?? "",
        rssi: null,
        uuids: [],
        lastSeen: Date.now(),
        count: 1,
      });
      setDevices(Array.from(mapRef.current.values()).sort((a, b) => b.lastSeen - a.lastSeen));
    } catch (err) {
      if (err instanceof Error && err.name !== "NotFoundError") {
        setState("error");
        setError(err.message);
      }
    }
  }, []);

  const clear = useCallback(() => {
    mapRef.current.clear();
    setDevices([]);
  }, []);

  useEffect(() => () => scanRef.current?.stop(), []);

  return { supported, state, devices, error, start, stop, pick, clear };
}

export type BleScan = ReturnType<typeof useBleScan>;
