import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ShowcaseListItem } from "@/components/showcase/ShowcaseCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (fn: string, args?: Record<string, unknown>) => (supabase as any).rpc(fn, args) as Promise<{ data: unknown; error: unknown }>;

export interface ShowcaseStats { prototypes: number; audits: number; makeovers: number; plans: number; emails: number; showcase: number; since: string | null }

export async function fetchShowcase(opts: { kind?: string | null; industry?: string | null; limit?: number; before?: string | null } = {}): Promise<ShowcaseListItem[]> {
  const { data, error } = await rpc("showcase_list", { p_kind: opts.kind ?? null, p_industry: opts.industry ?? null, p_limit: opts.limit ?? 24, p_before: opts.before ?? null });
  return !error && Array.isArray(data) ? (data as ShowcaseListItem[]) : [];
}

export function useShowcase(opts: { kind?: string | null; industry?: string | null; limit?: number }) {
  const [items, setItems] = useState<ShowcaseListItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    setItems(null);
    fetchShowcase(opts).then((v) => { if (alive) setItems(v); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.kind, opts.industry, opts.limit]);
  return items;
}

let statsPromise: Promise<ShowcaseStats | null> | null = null;
export function useShowcaseStats() {
  const [s, setS] = useState<ShowcaseStats | null>(null);
  useEffect(() => {
    let alive = true;
    statsPromise ??= rpc("showcase_stats").then(({ data, error }) => (!error && data ? (data as ShowcaseStats) : null)).catch(() => null);
    statsPromise.then((v) => { if (alive) setS(v); });
    return () => { alive = false; };
  }, []);
  return s;
}

export async function likeShowcase(slug: string): Promise<number | null> {
  const { data, error } = await rpc("showcase_like", { p_slug: slug });
  return error ? null : (data as number);
}
