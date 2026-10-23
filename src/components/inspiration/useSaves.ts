import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Example } from "@/lib/inspiration/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** The signed-in member's saved examples (private: the database only returns their own rows). */
export function useSaves() {
  const [uid, setUid] = useState<string | null>(null);
  const [saves, setSaves] = useState<{ example_id: string; collection: string }[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const load = useCallback(async (u: string | null) => {
    if (!u) { setSaves([]); setReady(true); return; }
    const { data } = await db.from("inspiration_saves").select("example_id,collection").eq("user_id", u).order("created_at", { ascending: false }).limit(2000);
    setSaves(data ?? []); setReady(true);
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { const u = data.session?.user.id ?? null; setUid(u); void load(u); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { const u = s?.user.id ?? null; setUid(u); void load(u); });
    return () => sub.subscription.unsubscribe();
  }, [load]);
  const isSaved = (id: string) => saves.some((s) => s.example_id === id);
  const collections = [...new Set(saves.map((s) => s.collection))];
  async function save(ex: Example, collection = "Saved") {
    if (!uid) { navigate({ to: "/login", search: { next: `/inspiration/${ex.id}` } as never }); return; }
    const { error } = await db.from("inspiration_saves").insert({ user_id: uid, example_id: ex.id, collection });
    if (error && error.code !== "23505") throw new Error(error.message);
    await load(uid);
  }
  async function unsave(ex: Example, collection?: string) {
    if (!uid) return;
    let q = db.from("inspiration_saves").delete().eq("user_id", uid).eq("example_id", ex.id);
    if (collection) q = q.eq("collection", collection);
    const { error } = await q; if (error) throw new Error(error.message);
    await load(uid);
  }
  const toggle = async (ex: Example) => { setError(""); try { if (isSaved(ex.id)) await unsave(ex); else await save(ex); } catch (e) { setError(e instanceof Error ? e.message : "Couldn't save that. Please try again."); } };
  return { uid, ready, saves, isSaved, collections, save, unsave, toggle, error, setError };
}
