import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { profileById } from "./api";
import type { Profile } from "./types";

/**
 * One shared store for the signed-in member and their community profile, so every Community
 * component sees the same state without refetching. Authorisation is always enforced by the
 * database; this only drives what the interface offers.
 */
interface State { ready: boolean; uid: string | null; email: string | null; profile: Profile | null; staff: boolean }
let state: State = { ready: false, uid: null, email: null, profile: null, staff: false };
const listeners = new Set<() => void>();
let started = false;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

async function loadFor(uid: string | null, email: string | null) {
  if (!uid) { set({ ready: true, uid: null, email: null, profile: null, staff: false }); return; }
  try {
    const [profile, roles] = await Promise.all([
      profileById(uid),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("user_roles").select("role").eq("user_id", uid),
    ]);
    const staff = Boolean(roles?.data?.some((r: { role: string }) => r.role === "admin" || r.role === "moderator"));
    set({ ready: true, uid, email, profile, staff });
  } catch {
    set({ ready: true, uid, email, profile: null, staff: false });
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  // If session storage never answers (e.g. blocked storage), show the signed-out view rather than a
  // spinner forever; onAuthStateChange still upgrades the view if a session appears later.
  const fallback = window.setTimeout(() => { if (!state.ready) set({ ready: true }); }, 5000);
  supabase.auth.getSession()
    .then(({ data }) => loadFor(data.session?.user.id ?? null, data.session?.user.email ?? null))
    .catch(() => loadFor(null, null))
    .finally(() => window.clearTimeout(fallback));
  supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user.id ?? null;
    if (uid !== state.uid || !state.ready) void loadFor(uid, session?.user.email ?? null);
  });
}

export function refreshProfile(): Promise<void> {
  return loadFor(state.uid, state.email);
}

const serverState: State = { ready: false, uid: null, email: null, profile: null, staff: false };

export function useCommunitySession(): State {
  useEffect(start, []);
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
    () => serverState,
  );
}
