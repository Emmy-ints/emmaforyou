import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import Navbar from "../Navbar";
import Footer from "../Footer";
import { KineticText } from "../future/Kinetic";

/* Each tool keeps one accent so it reads as its own instrument inside the same brand. */
const HUES: [RegExp, string][] = [
  [/^\/ai-receptionist/, "#3ddc97"], [/^\/book/, "#4f7bff"], [/^\/checklists/, "#3dd6f5"], [/^\/compare/, "#f5b544"],
  [/^\/goal-planner/, "#ff8a4c"], [/^\/industries/, "#ff6bb5"], [/^\/makeover/, "#ff6bb5"], [/^\/newsletter/, "#f5b544"],
  [/^\/proposal/, "#8b7bff"], [/^\/smart-contract-check/, "#3dd6f5"], [/^\/solutions\/app-planner/, "#4f7bff"], [/^\/tools/, "#3ddc97"],
  [/^\/website-audit/, "#3dd6f5"], [/^\/unsubscribe/, "#8a90ad"],
];
const hueFor = (p: string) => HUES.find(([r]) => r.test(p))?.[1] ?? "#8b7bff";

/**
 * Shared layout for the interactive tools and utility pages: one H1, a direct intro and the tool,
 * then plain-language answers. The header is an "instrument": a slowly scanning lens in the tool's
 * own accent colour (large screens only); the tool sits on a faint measured grid. Answers are glass
 * cards. Nothing here changes what the tools do.
 */
export default function ToolShell({ eyebrow, title, intro, children, answers, width = "max-w-6xl" }: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  answers?: { q: string; a: string }[];
  width?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hue = hueFor(pathname);
  return (
    <div className="tsh min-h-screen bg-background text-foreground" style={{ ["--hue" as string]: hue }}>
      <Navbar />
      <main id="main-content" className={`relative mx-auto ${width} px-5 pb-24 pt-32`}>
        <div aria-hidden="true" className="tsh-glow" />
        <header className="tsh-head relative">
          <div className="relative max-w-3xl">
            <p className="tsh-eyebrow"><span aria-hidden="true" className="tsh-dot" />{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl"><KineticText text={title} base={60} /></h1>
            <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
          </div>
          <div className="tsh-lens" aria-hidden="true">
            <span className="tsh-ring" /><span className="tsh-ring tsh-ring-2" /><span className="tsh-ring tsh-ring-3" />
            <span className="tsh-scan" /><span className="tsh-core" />
            {[0, 1, 2, 3, 4].map((i) => <span key={i} className="tsh-blip" style={{ ["--i" as string]: i }} />)}
          </div>
        </header>
        <div className="tsh-bench relative mt-10">{children}</div>
        {answers && answers.length > 0 && (
          <section className="mt-20" aria-labelledby="tool-answers">
            <h2 id="tool-answers" className="font-display text-2xl font-semibold tracking-tight md:text-3xl">Good to know</h2>
            <ul className="tsh-answers grid mt-6">
              {answers.map((x, i) => (
                <li key={x.q} className="tsh-answer lg">
                  <span className="tsh-answer-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-semibold text-foreground">{x.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.a}</p>
                </li>
              ))}
            </ul>
            <nav aria-label="More free tools" className="mt-10">
              <p className="text-sm text-muted-foreground">More free tools</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[["/website-audit", "Website audit"], ["/ai-receptionist", "AI receptionist demo"], ["/proposal", "Instant proposal"], ["/makeover", "AI website makeover"], ["/book", "Book a strategy call"]].map(([to, label]) => (
                  <li key={to}><Link to={to} className="tsh-chip">{label}</Link></li>
                ))}
              </ul>
            </nav>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
