import { useEffect, useRef, useState, type ReactNode } from "react";

export type Platform = "ios" | "android";

/** Logical screen size (CSS px) of the phone the prototype is drawn for; the frame scales to fit. */
export const SCREEN = { w: 390, h: 844 };
const BEZEL = 12;
const BAR = { ios: 50, android: 32 };
const HOME = { ios: 30, android: 22 };

function useClock() {
  const [now, setNow] = useState<string>("9:41");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, ""));
    tick();
    const t = window.setInterval(tick, 20000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function StatusIcons({ dark }: { dark: boolean }) {
  const c = dark ? "#fff" : "#0b0d24";
  return (
    <span className="flex items-center gap-[5px]" aria-hidden="true">
      <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1" fill={c} /><rect x="5" y="5" width="3" height="6" rx="1" fill={c} /><rect x="10" y="2.5" width="3" height="8.5" rx="1" fill={c} /><rect x="15" y="0" width="3" height="11" rx="1" fill={c} /></svg>
      <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .4 10.3 10.3 0 0 0 .8 3.3L2 4.6a8.5 8.5 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.6 6.6 0 0 0 8 4a6.6 6.6 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.5c.5 0 1 .2 1.3.6L8 11 6.7 9.9c.3-.4.8-.6 1.3-.6Z" fill={c} /></svg>
      <svg width="27" height="12" viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3.5" stroke={c} strokeOpacity=".45" fill="none" /><rect x="2" y="2" width="17" height="8" rx="2" fill={c} /><path d="M24.5 4v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill={c} fillOpacity=".5" /></svg>
    </span>
  );
}

/**
 * A realistic phone (iPhone-style dynamic island or Android punch-hole) around a prototype. The status bar
 * and home indicator are drawn here, outside the sandboxed prototype, so every generated app looks native.
 */
export default function PhoneFrame({ platform, children, maxHeight = 760, label }: { platform: Platform; children: ReactNode; maxHeight?: number; label?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const clock = useClock();
  const outerW = SCREEN.w + BEZEL * 2;
  const outerH = SCREEN.h + BEZEL * 2;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / outerW, maxHeight / outerH));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxHeight, outerW, outerH]);

  const ios = platform === "ios";
  return (
    <div ref={host} className="efy-phone-host">
      <div className="efy-phone-sizer" style={{ width: outerW * scale, height: outerH * scale }}>
      <div
        className={`efy-phone efy-phone-${platform}`}
        style={{ width: outerW, height: outerH, transform: `scale(${scale})` }}
        role="group"
        aria-label={label ?? (ios ? "iPhone preview" : "Android phone preview")}
      >
        <span className="efy-phone-btn efy-phone-btn-a" aria-hidden="true" />
        <span className="efy-phone-btn efy-phone-btn-b" aria-hidden="true" />
        <span className="efy-phone-btn efy-phone-btn-c" aria-hidden="true" />
        <div className="efy-phone-screen" style={{ width: SCREEN.w, height: SCREEN.h }}>
          <div className="efy-phone-bar" style={{ height: BAR[platform] }}>
            <span className="efy-phone-time">{clock}</span>
            {ios ? <span className="efy-phone-island" aria-hidden="true" /> : <span className="efy-phone-hole" aria-hidden="true" />}
            <StatusIcons dark={false} />
          </div>
          <div className="efy-phone-app" style={{ top: BAR[platform], bottom: HOME[platform] }}>{children}</div>
          <div className="efy-phone-home" style={{ height: HOME[platform] }} aria-hidden="true"><span /></div>
        </div>
      </div>
      </div>
    </div>
  );
}
