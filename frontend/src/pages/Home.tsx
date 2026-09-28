import { useEffect } from "react";
import Lenis from "lenis";
import { Header } from "@/components/bluesdet/Header";
import { Hero } from "@/components/bluesdet/Hero";
import { Marquee } from "@/components/bluesdet/Marquee";
import { ScannerHub } from "@/components/bluesdet/ScannerHub";
import { WebhookProtector } from "@/components/bluesdet/WebhookProtector";
import { LuaObfuscator } from "@/components/bluesdet/LuaObfuscator";
import { OwnerSection } from "@/components/bluesdet/OwnerSection";
import { Bento } from "@/components/bluesdet/Bento";
import { Compatibility } from "@/components/bluesdet/Compatibility";
import { Footer } from "@/components/bluesdet/Footer";
import { setLenis } from "@/lib/scroll";
import { useBleScan } from "@/hooks/useBleScan";

export default function Home() {
  const ble = useBleScan();

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    setLenis(lenis);
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <div className="min-h-svh bg-[#04060b] text-slate-200 antialiased selection:bg-sky-400/30 selection:text-sky-100">
      <Header />
      <main>
        <Hero ble={ble} />
        <Marquee />
        <ScannerHub ble={ble} />
        <WebhookProtector />
        <LuaObfuscator />
        <OwnerSection />
        <Bento />
        <Compatibility />
      </main>
      <Footer />
    </div>
  );
}
