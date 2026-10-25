import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";
import AccountAuthForm from "@/components/auth/AccountAuthForm";
import { check, db, ErrorText, Loading, useLoad, type AgentRow } from "@/components/agents-admin/shared";
import { OverviewTab } from "@/components/agents-admin/Overview";
import { AgentsTab } from "@/components/agents-admin/Agents";
import { ContentTab } from "@/components/agents-admin/Content";
import { ActivityTab } from "@/components/agents-admin/Activity";
import { LeadsTab } from "@/components/agents-admin/Leads";
import { JobsTab } from "@/components/agents-admin/Jobs";
import { SettingsTab } from "@/components/agents-admin/Settings";
import { LogsTab } from "@/components/agents-admin/Logs";

const TABS = [
  ["overview", "Overview"], ["agents", "Agents"], ["content", "Content"], ["activity", "Activity & takeover"],
  ["leads", "Leads"], ["jobs", "Jobs"], ["settings", "Settings & knowledge"], ["logs", "Logs"],
] as const;
type Tab = (typeof TABS)[number][0];

export const Route = createFileRoute("/dashboard_/agents")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => (TABS.some(([t]) => t === s.tab) ? { tab: s.tab as Tab } : {}),
  head: () => pageHead({ title: "Agent Control Center | EmmaForYou", description: "Manage the EmmaForYou AI agent team.", path: "/dashboard/agents", noindex: true }),
  component: AgentsAdminPage,
});

function AgentsAdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    return () => sub.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    // Display gate only: every query below is also refused by the database for non-admins.
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => setIsAdmin(Boolean(data?.some((r) => r.role === "admin"))));
  }, [session]);

  if (checking || (session && isAdmin === null)) return <Shell><Loading /></Shell>;
  if (!session) return (
    <Shell><div className="mx-auto mt-10 max-w-sm rounded-3xl border border-border bg-card p-7"><h1 className="mb-1 font-display text-xl font-bold"><KineticText text="Agent Control Center" base={60} /></h1><p className="mb-5 text-sm text-muted-foreground">Sign in with an admin account.</p><AccountAuthForm intent="account" next="/dashboard" idPrefix="agents-auth" /></div></Shell>
  );
  if (!isAdmin) return (
    <Shell><div className="mx-auto mt-10 max-w-md rounded-3xl border border-border bg-card p-8 text-center"><Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><h1 className="mt-4 font-display text-2xl font-extrabold"><KineticText text="Admins only" base={60} /></h1><p className="mt-2 text-sm text-muted-foreground">This account doesn't have the admin role.</p><Link to="/account" className="mt-4 inline-block text-sm font-semibold underline">Go to your account</Link></div></Shell>
  );
  return <ControlCenter />;
}

function ControlCenter() {
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate();
  const setTab = (t: Tab) => navigate({ to: "/dashboard/agents", search: t === "overview" ? {} : { tab: t }, replace: true });
  const agents = useLoad<AgentRow[]>(async () => check(await db.from("agent_profiles").select("*").order("sort").order("name")), [tab]);
  const [focus, setFocus] = useState<string | null>(null);
  const openAgent = (id: string) => { setFocus(id); setTab("agents"); };
  const clearFocus = useCallback(() => setFocus(null), []);
  const list = agents.data ?? [];

  return (
    <Shell>
      <header className="mb-4">
        <h1 className="font-display text-2xl font-extrabold tracking-tight"><KineticText text="Agent Control Center" base={60} /></h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Your team of automated AI specialists in the Community: what they're doing, what's waiting for you, and every setting. Agents are always labelled as AI to members, and you can pause everything or take over any thread.</p>
      </header>
      <nav aria-label="Control center sections" className="sticky top-0 z-20 -mx-4 mb-4 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <ul className="flex gap-1 py-2">{TABS.map(([id, l]) => (
          <li key={id}><button type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${tab === id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{l}</button></li>
        ))}</ul>
      </nav>
      {agents.error && tab !== "overview" ? <ErrorText message={agents.error} onRetry={agents.reload} /> : (
        <>
          {tab === "overview" && <OverviewTab onOpenAgent={openAgent} agents={list} />}
          {tab === "agents" && <AgentsTab focus={focus} onFocused={clearFocus} />}
          {tab === "content" && <ContentTab agents={list} />}
          {tab === "activity" && <ActivityTab agents={list} />}
          {tab === "leads" && <LeadsTab agents={list} />}
          {tab === "jobs" && <JobsTab agents={list} />}
          {tab === "settings" && <SettingsTab agents={list} />}
          {tab === "logs" && <LogsTab agents={list} />}
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="dash-x min-h-screen bg-background text-foreground">
      <div className="border-b border-border"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"><Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Owner dashboard</Link><Link to="/community" className="text-sm text-muted-foreground hover:text-foreground">Community</Link></div></div>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <style>{`
        .dash-card { border: 1px solid var(--border); background: var(--card); border-radius: 20px; padding: 1.25rem; }
        .dash-h2 { font-family: var(--font-sora); font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; }
        .dash-input { display: block; width: 100%; padding: 0.6rem 0.8rem; border-radius: 0.75rem; background: var(--background); border: 1px solid var(--border); color: inherit; font-size: 0.9rem; outline: none; }
        .dash-input:focus { border-color: var(--emma-violet); box-shadow: 0 0 0 3px color-mix(in oklab, var(--emma-violet) 18%, transparent); }
        .dash-input:disabled { opacity: .6; }
        .dash-icon-btn { display: inline-grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px; border: 1px solid var(--border); color: var(--muted-foreground); background: var(--card); }
        .dash-icon-btn:hover { color: var(--foreground); background: var(--muted); }
      `}</style>
    </div>
  );
}
