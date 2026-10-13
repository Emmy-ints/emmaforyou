import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import { TOOLS_DIRECTORY, type ToolInfo } from "@/lib/tools-data";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

const GROUPS: ToolInfo["group"][] = ["AI tools", "Plan & estimate", "Learn", "Talk to us"];

export const Route = createFileRoute("/tools")({
  component: Page,
  head: () =>
    pageHead({
      title: "Free Business Tools — AI Audit, Proposal, Planner & More",
      description: "Every free EmmaForYou tool in one place: website audit, AI receptionist, makeover, smart contract check, proposal, goal planner, ROI calculator and guides.",
      path: "/tools",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Free tools", path: "/tools" }]),
        itemListLd("Free tools", TOOLS_DIRECTORY.filter((t) => !t.to.includes("#")).map((t) => ({ name: t.name, path: t.to }))),
      ],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free · no sign-up"
      title="Free tools to grow your business"
      intro="Audit your website, see AI answer your customers, get a proposal and price, plan your next 90 days, or check a smart contract. Each tool tells you what it does and what you'll get."
      answers={[
        { q: "Are these tools really free?", a: "Yes. They're free with fair-use limits per hour, and none need an account. If you'd like help acting on the results, you can book a free call." },
        { q: "What happens to the information I enter?", a: "Most tools don't store your answers. We only save your details when you ask us to contact you, for example to request an expert review." },
      ]}
    >
      <div className="space-y-12">
        {GROUPS.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="font-display text-2xl font-semibold tracking-tight">{g}</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS_DIRECTORY.filter((t) => t.group === g).map((t) => (
                <li key={t.to}>
                  <Link to={t.to.includes("#") ? "/" : t.to} hash={t.to.includes("#") ? t.to.split("#")[1] : undefined} className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
                    <div className="flex items-center justify-between"><span className="text-2xl" aria-hidden="true">{t.icon}</span><span className="text-xs text-muted-foreground">{t.time}</span></div>
                    <h3 className="mt-3 font-display text-lg font-semibold">{t.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">What it does: </span>{t.does}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground"><span className="font-medium text-foreground">You get: </span>{t.get}</p>
                    <span className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ToolShell>
  );
}
