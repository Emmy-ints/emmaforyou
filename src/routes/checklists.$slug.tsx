import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import ChecklistView from "../components/tools/ChecklistView";
import { CHECKLISTS, findChecklist, itemCount } from "@/lib/checklists";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/checklists/$slug")({
  component: Page,
  loader: ({ params }) => {
    const c = findChecklist(params.slug);
    if (!c) throw notFound();
    return { slug: c.slug };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? findChecklist(loaderData.slug) : undefined;
    if (!c) return { meta: [{ title: "Checklist not found — EmmaForYou" }, { name: "robots", content: "noindex" }] };
    return pageHead({
      title: c.seoTitle,
      description: c.description.length > 158 ? `${c.description.slice(0, 155)}…` : c.description,
      path: `/checklists/${c.slug}`,
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Checklists", path: "/checklists" }, { name: c.title, path: `/checklists/${c.slug}` }])],
    });
  },
  notFoundComponent: () => (
    <ToolShell eyebrow="Checklists" title="That checklist doesn't exist" intro="It may have been renamed.">
      <Link to="/checklists" className="font-semibold text-[var(--emma-violet)]">See all checklists →</Link>
    </ToolShell>
  ),
});

function Page() {
  const { slug } = Route.useLoaderData();
  const c = findChecklist(slug)!;
  const others = CHECKLISTS.filter((x) => x.slug !== slug);
  return (
    <ToolShell eyebrow={`Free checklist · ${itemCount(c)} checks`} title={c.title} intro={`${c.description} For: ${c.audience.toLowerCase()}.`} width="max-w-4xl">
      <ChecklistView c={c} />
      <section className="no-print mt-14" aria-labelledby="more-cl">
        <h2 id="more-cl" className="font-display text-xl font-semibold">More free checklists</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {others.map((o) => (
            <li key={o.slug}><Link to="/checklists/$slug" params={{ slug: o.slug }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-[var(--emma-violet)]"><span className="text-2xl" aria-hidden="true">{o.icon}</span><span className="font-semibold">{o.title}</span></Link></li>
          ))}
        </ul>
      </section>
    </ToolShell>
  );
}
