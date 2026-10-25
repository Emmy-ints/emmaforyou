import type { ReactNode } from "react";
import { KineticText } from "./Kinetic";

/**
 * Full-screen state (404, unexpected error): midnight band, a quiet CSS orb and the code in large
 * outlined type. No WebGL here, so it renders instantly even when the rest of the app failed.
 */
export default function StatusScreen({ code, title, body, actions, detail }: { code: string; title: string; body: string; actions: ReactNode; detail?: ReactNode }) {
  return (
    <main id="main-content" className="hero-ink status-screen relative flex min-h-[100svh] items-center overflow-hidden px-5">
      <div className="hero-ink-grid" aria-hidden="true" />
      <div className="status-orb" aria-hidden="true"><div className="efy-orb-fallback" /></div>
      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <p className="status-code" aria-hidden="true">{code}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white md:text-5xl"><KineticText text={title} base={60} /></h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-white/70">{body}</p>
        {detail}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
        <p className="mt-10 text-xs text-white/40">Tip: press <kbd className="status-kbd">/</kbd> to search the whole site.</p>
      </div>
    </main>
  );
}
