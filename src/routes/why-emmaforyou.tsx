import { createFileRoute, Link } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { CheckCircle2, XCircle } from "lucide-react";
import ToolShell from "../components/tools/ToolShell";
import { PROJECTS, projectSlug } from "@/lib/portfolio-data";
import { FOUNDER, pageHead, breadcrumbLd } from "@/lib/seo";

const PROBLEMS = [
  { title: "Too many freelancers, nobody owns the result", body: "One person built the website, another runs social media, a third boosts posts. When sales are flat, everyone points at someone else." },
  { title: "Customers wait, then buy elsewhere", body: "Messages sit unanswered for hours, especially at night and on weekends." },
  { title: "Money spent with no idea what worked", body: "No tracking, no reports, just a feeling that marketing is expensive." },
  { title: "Agencies that disappear after launch", body: "A nice website, then silence, and no one to call when something needs to change." },
];

const DIFFERENT = [
  { title: "One team for the whole growth system", body: "Websites and apps, AI automation, email, social, ads, conversion optimisation, consulting and Web3, planned together and measured together." },
  { title: "Direct access to the founder", body: `You work with ${FOUNDER.name} on WhatsApp, not a chain of account managers.` },
  { title: "AI-native, not AI-washed", body: "We build real AI assistants, audits and automations, and you can try them on this site before you buy anything." },
  { title: "Published prices", body: "Monthly plans are on our pricing page. One-off work gets a fixed quote after a free call, before work starts." },
  { title: "Month-to-month plans", body: "No long lock-in contracts on monthly plans. We earn the next month every month." },
  { title: "Measured from day one", body: "We agree the numbers that matter and set up tracking before launch, then report on them." },
  { title: "A portal for everything", body: "Approvals, invoices, files and messages in one place, so nothing gets lost in chat." },
  { title: "Honest advice", body: "If something isn't worth doing yet, we'll say so before you spend money on it." },
];

const FIT = ["You want more enquiries, bookings or sales, and you're ready to act on a plan", "You'd rather have one accountable partner than several freelancers", "You value fast communication and clear numbers", "You're building something new, including Web3, and want it done properly"];
const NOT_FIT = ["You want guaranteed rankings, followers or revenue overnight", "You're looking for the cheapest possible option regardless of results", "You don't want to measure anything"];

const STEPS = [
  { title: "Free strategy call", body: "We learn your business, goals and numbers, and tell you honestly what we'd do first." },
  { title: "Proposal and plan", body: "A written scope, timeline and price. No surprises." },
  { title: "Build and launch", body: "We build, connect and test everything, with your approval at each step in the client portal." },
  { title: "Measure and improve", body: "Regular reports and improvements based on what the numbers show." },
];

export const Route = createFileRoute("/why-emmaforyou")({
  component: Page,
  head: () =>
    pageHead({
      title: "Why EmmaForYou — One Team for Your Whole Growth System",
      description: "The problems most growing businesses face with agencies and freelancers, how EmmaForYou works differently, who we're a good fit for, and what to expect.",
      path: "/why-emmaforyou",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Why EmmaForYou", path: "/why-emmaforyou" }])],
    }),
});

function Page() {
  const showcase = PROJECTS.slice(0, 6);
  return (
    <ToolShell
      eyebrow="Why EmmaForYou"
      title="One team for your whole growth system"
      intro="Most businesses don't need more tools or more freelancers. They need one partner who connects being found, converting visitors, replying instantly and following up, and who measures all of it."
      answers={[
        { q: "How quickly can we start?", a: "After a free call you'll have a written proposal. Onboarding starts within a week of signing." },
        { q: "Do you work with businesses outside Nigeria?", a: "Yes. We work with clients in Nigeria, the USA, the UK, Europe and across Africa, by video call and WhatsApp." },
        { q: "What does it cost?", a: "Monthly plans start at $99 and are published on our pricing page. One-off projects get a fixed quote after a free call." },
      ]}
    >
      <div className="space-y-16">
        <section aria-labelledby="w-problem">
          <h2 id="w-problem" className="font-display text-2xl font-semibold tracking-tight md:text-3xl"><KineticText text="The problem we see every week" base={30} /></h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-[20px] border border-border bg-card p-5"><h3 className="font-semibold">{p.title}</h3><p className="mt-1.5 text-sm text-muted-foreground">{p.body}</p></div>
            ))}
          </div>
        </section>

        <section aria-labelledby="w-diff">
          <h2 id="w-diff" className="font-display text-2xl font-semibold tracking-tight md:text-3xl"><KineticText text="What we do differently" base={30} /></h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENT.map((d) => (
              <div key={d.title} className="rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)]"><CheckCircle2 className="h-5 w-5 text-[var(--emma-violet)]" /><h3 className="mt-3 font-semibold">{d.title}</h3><p className="mt-1.5 text-sm text-muted-foreground">{d.body}</p></div>
            ))}
          </div>
        </section>

        <section aria-labelledby="w-work">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="w-work" className="font-display text-2xl font-semibold tracking-tight md:text-3xl"><KineticText text="Real client work" base={30} /></h2>
            <Link to="/portfolio" className="text-sm font-semibold text-[var(--emma-violet)]">See all projects →</Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.map((p) => (
              <li key={p.name}>
                <Link to="/portfolio/$slug" params={{ slug: projectSlug(p.name) }} className="block h-full rounded-[20px] border border-border bg-card p-5 hover:border-[var(--emma-violet)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{p.category}</p>
                  <h3 className="mt-1 font-semibold">{p.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
                  <p className="mt-3 font-display text-lg font-semibold text-[var(--emma-violet)]">{p.outcome}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="w-fit" className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[20px] border border-border bg-card p-6">
            <h2 id="w-fit" className="font-display text-xl font-semibold"><KineticText text="We're a great fit if…" base={30} /></h2>
            <ul className="mt-4 space-y-2.5 text-sm">{FIT.map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}</li>)}</ul>
          </div>
          <div className="rounded-[20px] border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold"><KineticText text="We're probably not right if…" base={30} /></h2>
            <ul className="mt-4 space-y-2.5 text-sm">{NOT_FIT.map((f) => <li key={f} className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{f}</li>)}</ul>
          </div>
        </section>

        <section aria-labelledby="w-steps">
          <h2 id="w-steps" className="font-display text-2xl font-semibold tracking-tight md:text-3xl"><KineticText text="How working together works" base={30} /></h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-[20px] border border-border bg-card p-5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--emma-violet)] text-sm font-semibold text-white">{i + 1}</span><h3 className="mt-3 font-semibold">{s.title}</h3><p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p></li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/book" className="btn-primary-gradient inline-flex rounded-full px-6 py-3 font-semibold text-white">Book a free strategy call</Link>
            <Link to="/proposal" className="inline-flex rounded-full border border-border px-6 py-3 font-semibold hover:border-[var(--emma-violet)]">Get an instant proposal</Link>
          </div>
        </section>
      </div>
    </ToolShell>
  );
}
