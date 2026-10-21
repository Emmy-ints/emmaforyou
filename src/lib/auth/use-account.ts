import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * The signed-in EmmaForYou account, shared by the header, /login and /account. The session itself
 * is Supabase Auth's (one session for the whole site); what an account can do is checked by the
 * database on every request, so this only decides what the interface offers.
 */
export interface AccountSummary { email: string | null; email_verified: boolean; client_portal: boolean; community_profile: string | null; admin: boolean; staff: boolean }
interface State { ready: boolean; signedIn: boolean; userId: string | null; email: string | null; summary: AccountSummary | null }
let state: State = { ready: false, signedIn: false, userId: null, email: null, summary: null };
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
let started = false;

async function load(userId: string | null, email: string | null) {
  if (!userId) { state = { ready: true, signedIn: false, userId: null, email: null, summary: null }; emit(); return; }
  state = { ...state, ready: true, signedIn: true, userId, email };
  emit();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc("my_account_summary").then((r: unknown) => r).catch(() => ({ data: null }));
  if (state.userId === userId) { state = { ...state, summary: (data as AccountSummary | null) ?? null }; emit(); }
}

export function refreshAccount() { void load(state.userId, state.email); }

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const fallback = window.setTimeout(() => { if (!state.ready) { state = { ...state, ready: true }; emit(); } }, 5000);
  supabase.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null, data.session?.user.email ?? null)).catch(() => load(null, null)).finally(() => window.clearTimeout(fallback));
  supabase.auth.onAuthStateChange((_e, s) => { const id = s?.user.id ?? null; if (id !== state.userId || !state.ready) void load(id, s?.user.email ?? null); });
}

const server: State = { ready: false, signedIn: false, userId: null, email: null, summary: null };
export function useAccount(): State {
  useEffect(start, []);
  return useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state, () => server);
}

/** Sign out of EmmaForYou everywhere: this ends the session in every area of the site and revokes it on other devices too. */
export async function signOutEverywhere(scope: "global" | "local" = "global") {
  await supabase.auth.signOut({ scope });
}
