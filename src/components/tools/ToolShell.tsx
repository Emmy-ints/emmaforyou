import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import Navbar from "../Navbar";
import Footer from "../Footer";

/** Shared layout for the interactive tools: one H1, a direct intro, the tool, then plain-language answers. */
export default function ToolShell({ eyebrow, title, intro, children, answers, width = "max-w-6xl" }: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  answers?: { q: string; a: string }[];
  width?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className={`mx-auto ${width} px-5 pb-24 pt-32`}>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--emma-violet)]">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        </div>
        <div className="mt-10">{children}</div>
        {answers && answers.length > 0 && (
          <section className="mt-16 max-w-3xl" aria-labelledby="tool-answers">
            <h2 id="tool-answers" className="font-display text-2xl font-semibold tracking-tight">Good to know</h2>
            <div className="mt-5 space-y-5">
              {answers.map((x) => (
                <div key={x.q}>
                  <h3 className="font-semibold text-foreground">{x.q}</h3>
                  <p className="mt-1.5 text-muted-foreground">{x.a}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              More free tools: <Link to="/website-audit" className="text-[var(--emma-violet)] underline-offset-4 hover:underline">website audit</Link>,{" "}
              <Link to="/ai-receptionist" className="text-[var(--emma-violet)] underline-offset-4 hover:underline">AI receptionist demo</Link>,{" "}
              <Link to="/proposal" className="text-[var(--emma-violet)] underline-offset-4 hover:underline">instant proposal</Link>,{" "}
              <Link to="/makeover" className="text-[var(--emma-violet)] underline-offset-4 hover:underline">AI website makeover</Link> and{" "}
              <Link to="/book" className="text-[var(--emma-violet)] underline-offset-4 hover:underline">book a strategy call</Link>.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
