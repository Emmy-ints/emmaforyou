// @ts-nocheck -- generated DB types lag behind; runtime verified
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LabRunner from "@/components/lab/LabRunner";
import { KineticText } from "@/components/future/Kinetic";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import { validate, type LabConfig, type Template } from "@/lib/lab/engine";

export const Route = createFileRoute("/lab/$slug")({
  loader: async ({ params }) => {
    const { data } = await (supabase as any).rpc("site_lab_live", { _slug: params.slug });
    if (!data) throw notFound();
    return { item: data as { title: string; template: Template; config: LabConfig; slug: string; published_at: string } };
  },
  head: ({ loaderData }) => loaderData ? pageHead({ title: `${loaderData.item.title} (beta) | EmmaForYou Lab`, description: loaderData.item.config.intro?.slice(0, 155) || "An interactive tool from the EmmaForYou lab.", path: `/lab/${loaderData.item.slug}` }) : { meta: [{ title: "Not found — EmmaForYou" }, { name: "robots", content: "noindex" }] },
  component: LabItem,
});

function LabItem() {
  const { item } = Route.useLoaderData();
  const problems = validate(item.template, item.config);
  return (
    <>
      <Navbar />
      <main id="main-content" className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
        <Link to="/lab" className="text-sm text-muted-foreground hover:text-foreground">← EmmaForYou Lab</Link>
        <p className="sx-kicker mt-4"><span className="sx-kicker-dot" aria-hidden="true" />Beta tool</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl"><KineticText text={item.title} base={40} /></h1>
        <div className="lg-strong mt-6 rounded-3xl p-5 sm:p-7">
          {problems.length ? <p className="text-sm text-muted-foreground">This tool is being updated. Please check back soon.</p> : <LabRunner template={item.template} config={item.config} title={item.title} />}
        </div>
      </main>
      <Footer />
    </>
  );
}
