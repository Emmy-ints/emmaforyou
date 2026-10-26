// @ts-nocheck -- generated DB types lag behind; runtime verified
import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { KineticText } from "@/components/future/Kinetic";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { TEMPLATES } from "@/lib/lab/engine";
import { useFlag } from "@/lib/site-settings";

export const Route = createFileRoute("/lab/")({
  loader: async () => {
    const { data } = await (supabase as any).rpc("site_lab_live_list");
    return { items: (data ?? []) as { slug: string; title: string; template: string; published_at: string }[] };
  },
  head: () => pageHead({ title: "EmmaForYou Lab — new interactive tools | EmmaForYou", description: "New calculators, assessments, planners and demos from the EmmaForYou lab. Each one is tested before it's published.", path: "/lab" }),
  component: LabIndex,
});

function LabIndex() {
  const { items } = Route.useLoaderData();
  const on = useFlag("lab-gallery");
  return (
    <>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
        <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />Beta</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight"><KineticText text="The EmmaForYou Lab" base={40} /></h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">New tools we're trying out. Each one passed its tests before going live, and they're labelled beta while we learn from how people use them.</p>
        {!on || !items.length ? <p className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">No lab tools are published right now. Try the <Link to="/tools" className="font-semibold text-[var(--emma-violet)]">free tools</Link> instead.</p> : (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">{items.map((i) => (
            <li key={i.slug}><Link to="/lab/$slug" params={{ slug: i.slug }} className="lg block rounded-3xl p-5 transition hover:-translate-y-0.5">
              <FlaskConical className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" />
              <p className="mt-2 font-display text-lg font-semibold">{i.title}</p>
              <p className="text-sm text-muted-foreground">{TEMPLATES.find((t) => t.id === i.template)?.name ?? "Tool"}</p>
            </Link></li>))}</ul>
        )}
      </main>
      <Footer />
    </>
  );
}
