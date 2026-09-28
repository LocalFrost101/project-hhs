import { useCallback, useEffect, useRef, useState } from "react";

interface MagnetometerSensor extends EventTarget {
  x: number | null;
  y: number | null;
  z: number | null;
  start(): void;
  stop(): void;
}

export function useMagnetometer() {
  const [supported, setSupported] = useState(true);
  const [active, setActive] = useState(false);
  const [magnitude, setMagnitude] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<number | null>(null);
  const sensorRef = useRef<MagnetometerSensor | null>(null);

  const start = useCallback(() => {
    const Ctor = (
      window as unknown as { Magnetometer?: new (o: { frequency: number }) => MagnetometerSensor }
    ).Magnetometer;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    try {
      const s = new Ctor({ frequency: 8 });
      s.addEventListener("reading", () => {
        const x = s.x ?? 0;
        const y = s.y ?? 0;
        const z = s.z ?? 0;
        const mag = Math.sqrt(x * x + y * y + z * z);
        setMagnitude(mag);
        setBaseline((b) => (b === null ? mag : b * 0.985 + mag * 0.015));
      });
      s.addEventListener("error", () => {
        setSupported(false);
        setActive(false);
      });
      s.start();
      sensorRef.current = s;
      setSupported(true);
      setActive(true);
    } catch {
      setSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    sensorRef.current?.stop();
    sensorRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => sensorRef.current?.stop(), []);

  const delta = magnitude !== null && baseline !== null ? magnitude - baseline : 0;
  return { supported, active, magnitude, delta, start, stop };
}
