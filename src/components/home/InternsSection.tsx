import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import SectionHead from "../future/SectionHead";
import { supabase } from "@/integrations/supabase/client";
import { CARD_FIELDS, type InternCard as Card } from "@/lib/interns";
import { DesignationBadge, Handle, InternPhoto } from "@/components/interns/InternCard";

/**
 * Homepage "Our Emerging Talent": the interns an admin selected for the homepage, in their order.
 * Reads the public view, so unpublished, archived or deselected profiles disappear on their own.
 * Renders nothing while there is no selection.
 */
export default function InternsSection() {
  const [rows, setRows] = useState<Card[] | null>(null);
  useEffect(() => {
    let off = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("interns_public").select(CARD_FIELDS).eq("homepage_featured", true).order("homepage_order", { ascending: true }).order("published_at", { ascending: true }).limit(12)
      .then(({ data }: { data: Card[] | null }) => { if (!off) setRows(data ?? []); }, () => { if (!off) setRows([]); });
    return () => { off = true; };
  }, []);
  if (!rows?.length) return null;
  return (
    <section id="emerging-talent" className="section-padding" aria-labelledby="itn-home-h">
      <div className="mx-auto max-w-7xl">
        <SectionHead id="itn-home-h" kicker="Our emerging talent" title="Meet Our Interns" shine={["Interns"]}
          sub="Specialists early in their careers who contribute to EmmaForYou projects under our team's direction. Each is clearly badged as an intern." className="max-w-3xl" />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((i) => (
            <li key={i.slug}>
              <Link to="/interns/$slug" params={{ slug: i.slug }} className="itn-card itn-phone itn-home-card group" data-track="home_intern">
                <InternPhoto i={i} />
                <span className="mt-4 block font-display text-lg font-semibold leading-tight group-hover:underline underline-offset-4">{i.display_name || `@${i.username}`}</span>
                {i.display_name && <Handle u={i.username} />}
                <DesignationBadge d={i.designation} className="mt-2" />
                <span className="mt-1 block text-sm text-muted-foreground">{i.specialty}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/interns" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--emma-violet)] hover:underline underline-offset-4" data-track="home_interns_all">
          View all interns <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
