import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review { id: string; rating: number; body: string; display_name: string; business: string | null; created_at: string }
const db = supabase as unknown as { from: (t: string) => any };

/** Reviews written by signed-in clients in the portal after an approved delivery, shown only with their permission and the owner's approval. Renders nothing until there is at least one. */
export default function VerifiedReviews({ limit = 12 }: { limit?: number }) {
  const [rows, setRows] = useState<Review[]>([]);
  useEffect(() => {
    db.from("client_testimonials")
      .select("id,rating,body,display_name,business,created_at")
      .eq("approved", true).eq("may_publish", true)
      .order("created_at", { ascending: false }).limit(limit)
      .then(({ data }: { data: Review[] | null }) => setRows(data || []));
  }, [limit]);
  if (rows.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-14" aria-labelledby="verified-reviews">
      <h2 id="verified-reviews" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight"><BadgeCheck className="h-6 w-6 text-[var(--emma-violet)]" aria-hidden="true" />Verified client reviews</h2>
      <p className="mt-2 text-sm text-muted-foreground">Written by clients in their private portal after approving a delivery, and published with their permission.</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-[20px] border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="text-amber-500" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-muted-foreground/30">{"★".repeat(5 - r.rating)}</span></p>
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground">“{r.body}”</blockquote>
            <p className="mt-4 text-sm font-semibold">{r.display_name}{r.business && <span className="font-normal text-muted-foreground"> · {r.business}</span>}</p>
            <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
