import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import { NICHES } from "@/lib/niches";
import { pageHead, breadcrumbLd, itemListLd } from "@/lib/seo";

export const Route = createFileRoute("/industries")({
  component: Page,
  head: () =>
    pageHead({
      title: "Industries We Help — Salons, Clinics, Restaurants, Real Estate & More",
      description: "How EmmaForYou helps salons, clinics, restaurants, real estate agents, fashion and ecommerce brands, coaches, gyms, schools, hotels, auto dealers and SaaS grow.",
      path: "/industries",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }]),
        itemListLd("Industries", NICHES.map((n) => ({ name: n.name, path: `/niche/${n.slug}` }))),
      ],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Who we help"
      title="Solutions for your industry"
      intro="Every industry loses customers in its own way: empty chairs, unanswered messages, abandoned carts, cold leads. Find yours to see the problems we solve and the services we'd use."
      answers={[
        { q: "My industry isn't listed. Can you still help?", a: "Very likely. We've worked with more than 50 types of business. Take the growth assessment or book a free call and we'll tell you honestly whether we're a good fit." },
      ]}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NICHES.map((n) => (
          <li key={n.slug}>
            <Link to="/niche/$slug" params={{ slug: n.slug }} className="flex h-full flex-col rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-[var(--emma-violet)]">
              <span className="text-3xl" aria-hidden="true">{n.flag}</span>
              <h2 className="mt-3 font-display text-lg font-semibold">{n.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{n.hero}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Common problems</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">{n.problems.map((p) => <li key={p}>{p}</li>)}</ul>
              <p className="mt-3 text-xs text-muted-foreground">How we help: {n.services.join(", ")}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-[var(--emma-violet)]">See the solution →</span>
            </Link>
          </li>
        ))}
      </ul>
    </ToolShell>
  );
}
