import { useEffect, useRef } from "react";

interface BlipSource {
  id: string;
  rssi: number | null;
}

function hashAngle(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 628) / 100;
}

export function RadarCanvas({ devices, scanning }: { devices: BlipSource[]; scanning: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const devicesRef = useRef(devices);
  const scanningRef = useRef(scanning);
  devicesRef.current = devices;
  scanningRef.current = scanning;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const S = 520;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr;
    canvas.height = S * dpr;

    let raf = 0;
    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const c = S / 2;
      const maxR = S / 2 - 22;
      const isScanning = scanningRef.current;

      ctx.strokeStyle = "rgba(56,189,248,0.16)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(c, c, (maxR * i) / 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(56,189,248,0.1)";
      ctx.beginPath();
      ctx.moveTo(c - maxR, c);
      ctx.lineTo(c + maxR, c);
      ctx.moveTo(c, c - maxR);
      ctx.lineTo(c, c + maxR);
      ctx.stroke();

      ctx.font = "9px 'JetBrains Mono Variable', monospace";
      ctx.fillStyle = "rgba(139,163,184,0.55)";
      const labels = ["1M", "3M", "10M", "20M+"];
      labels.forEach((label, i) => {
        ctx.fillText(label, c + ((maxR * (i + 1)) / 4) + 4, c - 4);
      });

      const ang = (t / 2600) % (Math.PI * 2);
      const sweepAlpha = isScanning ? 1 : 0.35;
      for (let i = 0; i < 44; i++) {
        const a = ang - i * 0.028;
        const alpha = 0.22 * (1 - i / 44) * sweepAlpha;
        ctx.strokeStyle = `rgba(56,189,248,${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.lineTo(c + Math.cos(a) * maxR, c + Math.sin(a) * maxR);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(125,211,252,${0.85 * sweepAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(ang) * maxR, c + Math.sin(ang) * maxR);
      ctx.stroke();

      for (const d of devicesRef.current.slice(0, 16)) {
        const a = hashAngle(d.id);
        const rNorm = d.rssi === null ? 0.55 : Math.min(0.95, Math.max(0.08, (-40 - d.rssi) / 55));
        const r = rNorm * maxR;
        const x = c + Math.cos(a) * r;
        const y = c + Math.sin(a) * r;
        const diff = (ang - a + Math.PI * 2) % (Math.PI * 2);
        const glow = Math.max(0, 1 - diff / 2.4);
        ctx.fillStyle = `rgba(56,189,248,${0.3 + glow * 0.7})`;
        ctx.shadowColor = "rgba(56,189,248,0.9)";
        ctx.shadowBlur = 6 + glow * 12;
        ctx.beginPath();
        ctx.arc(x, y, 3 + glow * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = "rgba(224,242,254,0.95)";
      ctx.shadowColor = "rgba(56,189,248,1)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(c, c, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="radar-canvas"
      className="aspect-square w-full"
      aria-label="Live radar sweep of detected devices"
    />
  );
}
