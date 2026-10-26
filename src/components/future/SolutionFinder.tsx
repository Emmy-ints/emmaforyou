import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Copy, MessageCircle, Sparkles, WandSparkles } from "lucide-react";
import SectionHead from "./SectionHead";
import FounderCard from "./FounderCard";
import { LeadCapture } from "../tools/LeadCapture";
import { BUDGETS, GOALS, findSolutions, familyHue, type GoalId } from "@/lib/solution-finder";
import { NICHES } from "@/lib/niches";
import { buildWa } from "@/lib/leads";
import { track } from "@/lib/analytics";

/**
 * "Describe your business → get a matched plan": business type, goals, budget and the visitor's
 * own words produce a shortlist from the real catalogue (each with the reason it matched), phases,
 * open questions and a brief they can send. Rule-based and labelled as such; "Ask Emma AI" hands
 * the same brief to the site assistant for a conversational follow-up.
 */
export default function SolutionFinder({ id = "solution-finder", compact = false }: { id?: string; compact?: boolean }) {
  const [business, setBusiness] = useState("");
  const [goals, setGoals] = useState<GoalId[]>([]);
  const [budget, setBudget] = useState("");
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => findSolutions({ business, goals, budget, text }), [business, goals, budget, text]);
  const ready = goals.length > 0 || text.trim().length >= 12;
  const toggle = (g: GoalId) => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));

  const run = () => { setShown(true); track("cta_click", { cta: "solution_finder", goals: goals.join(",") }); window.setTimeout(() => document.getElementById(`${id}-result`)?.focus(), 30); };

  return (
    <section id={id} className={`sf ${compact ? "" : "section-padding"}`} aria-labelledby={`${id}-h`}>
      <div className="mx-auto max-w-6xl">
        {!compact && (
          <SectionHead id={`${id}-h`} align="center" className="max-w-3xl" kicker={<><WandSparkles className="h-3.5 w-3.5" aria-hidden="true" />Solution finder</>}
            title="Tell us the problem. Get a matched plan." shine={["matched", "plan."]}
            sub="Pick what you want to achieve, add a sentence about your business, and see which services fit, in what order, and what we'd ask you first." />
        )}
        {compact && <h2 id={`${id}-h`} className="font-display text-2xl font-semibold tracking-tight">Prepare your brief first</h2>}

        <div className={`sf-grid ${compact ? "mt-5" : "mt-12"}`}>
          <form className="sf-form lg-strong" onSubmit={(e) => { e.preventDefault(); if (ready) run(); }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">Your business
                <select className="input mt-1" value={business} onChange={(e) => setBusiness(e.target.value)}>
                  <option value="">Choose a type (optional)</option>
                  {NICHES.map((n) => <option key={n.slug} value={n.name}>{n.name}</option>)}
                  <option value="Other">Something else</option>
                </select>
              </label>
              <label className="block text-sm font-medium">Budget
                <select className="input mt-1" value={budget} onChange={(e) => setBudget(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
            </div>
            <fieldset className="mt-5">
              <legend className="text-sm font-medium">What do you want to achieve? <span className="font-normal text-muted-foreground">(pick any)</span></legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g.id} type="button" aria-pressed={goals.includes(g.id)} onClick={() => toggle(g.id)} className="sf-goal">
                    {goals.includes(g.id) && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{g.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="mt-5 block text-sm font-medium">In your own words <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea className="input mt-1 min-h-[96px]" maxLength={900} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="e.g. We sell perfumes on Instagram, reply to DMs by hand and want a Shopify store with WhatsApp checkout." />
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={!ready} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
                <Sparkles className="h-4 w-4" aria-hidden="true" />Find my solution
              </button>
              {!ready && <span className="text-xs text-muted-foreground">Pick a goal or write a sentence to start.</span>}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Matches come from our real service catalogue using clear rules (no AI guesswork, nothing is sent until you choose to). Emmanuel reviews every brief personally.</p>
          </form>

          <div id={`${id}-result`} tabIndex={-1} className="sf-result" aria-live="polite">
            {!shown ? (
              <div className="sf-empty lg">
                <div className="sf-empty-orb" aria-hidden="true"><div className="efy-orb-fallback" /></div>
                <p className="font-display text-lg font-semibold">Your plan appears here</p>
                <p className="mt-1 text-sm text-muted-foreground">It updates as you change your answers.</p>
                {!compact && <div className="mt-6 w-full"><FounderCard size="sm" cta={false} line="I read every brief that comes in and reply personally, usually within a working day." /></div>}
              </div>
            ) : (
              <div className="sf-out">
                <div className="sf-block lg">
                  <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />What we heard</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{result.problem}</p>
                </div>
                <ol className="sf-matches">
                  {result.matches.map((m, i) => (
                    <li key={m.item.id} className="sf-match lg" style={{ ["--hue" as string]: familyHue(m.item.family), ["--i" as string]: i }}>
                      <span className="sf-rank" aria-hidden="true">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-foreground"><span aria-hidden="true">{m.item.icon}</span> {m.item.name}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{m.item.short}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Why: {m.why.join("; ")}.</p>
                      </div>
                      <Link to={m.item.href} className="sf-open" aria-label={`Open ${m.item.name}`}><ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                    </li>
                  ))}
                </ol>
                <div className="sf-block lg">
                  <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />How we'd approach it</p>
                  <ol className="sf-phases mt-3">{result.phases.map((p) => <li key={p.title}><p className="text-sm font-semibold text-foreground">{p.title}</p><p className="text-sm text-muted-foreground">{p.detail}</p></li>)}</ol>
                  {result.plan && <p className="mt-3 text-xs text-muted-foreground">Closest published plan for that budget: <Link to="/pricing" className="font-semibold text-foreground underline">{result.plan.name}, from {result.plan.price}</Link>. An indication only; the real quote follows the free call.</p>}
                </div>
                <div className="sf-block lg">
                  <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />What we'd ask you first</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.questions.map((q) => <li key={q}>{q}</li>)}</ul>
                  <div className="mt-4 flex flex-wrap gap-2">{result.tools.map((t) => <Link key={t.to} to={t.to} className="tsh-chip">{t.label}</Link>)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="nav-ghost" onClick={async () => { try { await navigator.clipboard.writeText(result.brief); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } }}>
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? "Brief copied" : "Copy brief"}
                  </button>
                  <a className="nav-ghost" href={buildWa(result.brief)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" aria-hidden="true" />Send on WhatsApp</a>
                  <button type="button" className="nav-ghost" onClick={() => window.dispatchEvent(new CustomEvent("efy-open-ask", { detail: `Based on this brief, which option fits best and why?\n\n${result.brief}` }))}><Sparkles className="h-4 w-4" aria-hidden="true" />Ask Emma AI about it</button>
                  <Link to="/book" className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Book a free call</Link>
                </div>
                <LeadCapture compact tool="Solution enquiry" title="Or send this brief to Emmanuel" lead="Leave a WhatsApp number or email and he'll reply personally." button="Send my brief" summary={result.brief} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
