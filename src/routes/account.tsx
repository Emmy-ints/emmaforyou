import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import { Loader2, Lock, Users, BarChart3, ShieldCheck, LogOut, KeyRound, CheckCircle2, ArrowRight, BookOpen } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/components/auth/AccountAuthForm";
import { refreshAccount, signOutEverywhere, useAccount } from "@/lib/auth/use-account";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/account")({
  head: () => pageHead({ title: "Your account — EmmaForYou", description: "Your EmmaForYou account: community, client portal, password and sign-out.", path: "/account", noindex: true }),
  component: AccountPage,
});

function AccountPage() {
  const { ready, signedIn, email, summary } = useAccount();
  const navigate = useNavigate();
  useEffect(() => { if (ready && !signedIn) navigate({ to: "/login", search: { next: "/account" }, replace: true }); }, [ready, signedIn, navigate]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto w-full max-w-3xl px-5 pb-20 pt-28 sm:pt-32">
        {!ready || !signedIn ? <div className="flex justify-center py-20" role="status"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /><h1 className="sr-only">Your account</h1><span className="sr-only">Loading your account</span></div> : (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-tight"><KineticText text="Your account" base={30} /></h1>
            <p className="mt-1 text-sm text-muted-foreground">Signed in as <span className="font-medium text-foreground">{email}</span>. This one account works across every EmmaForYou area.</p>
            <section aria-labelledby="areas-h" className="mt-8">
              <h2 id="areas-h" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your areas</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                <Area icon={Users} title="Community" text={summary?.community_profile ? `Profile @${summary.community_profile}` : "No profile yet: pick a username to post and comment."} to={summary?.community_profile ? "/community" : "/community/settings"} cta={summary?.community_profile ? "Open community" : "Set up profile"} />
                {summary?.client_portal
                  ? <Area icon={Lock} title="Client portal" text="Projects, approvals, invoices, files and messages." to="/portal" cta="Open portal" />
                  : <li><ActivatePortal /></li>}
                <Area icon={BookOpen} title="Author workspace" text="Your book projects: eBooks, covers, mockups, listing copy and launch plans." to="/account/books" cta="Open my books" />
                {summary?.admin && <Area icon={BarChart3} title="Owner dashboard" text="Analytics, leads, bookings, clients, blog and community." to="/dashboard" cta="Open dashboard" />}
                {summary?.staff && <Area icon={ShieldCheck} title="Community moderation" text="Reports queue and support inbox." to="/community/moderation" cta="Open moderation" />}
              </ul>
            </section>
            <ChangePassword />
            <section aria-labelledby="out-h" className="mt-6 rounded-2xl border border-border bg-card p-5">
              <h2 id="out-h" className="font-display text-lg font-bold">Sign out</h2>
              <p className="mt-1 text-sm text-muted-foreground">Signing out here signs you out of the community, portal and dashboard together.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={async () => { await signOutEverywhere("local"); navigate({ to: "/" }); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted"><LogOut className="h-4 w-4" aria-hidden="true" />Sign out on this device</button>
                <button type="button" onClick={async () => { await signOutEverywhere("global"); navigate({ to: "/" }); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted">Sign out on all devices</button>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Area({ icon: Icon, title, text, to, cta }: { icon: typeof Users; title: string; text: string; to: string; cta: string }) {
  return (
    <li>
      <Link to={to} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--emma-violet)]" data-tilt="3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--emma-violet)]/10 text-[var(--emma-violet)]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
        <span className="mt-3 font-display text-base font-bold">{title}</span>
        <span className="mt-1 flex-1 text-sm text-muted-foreground">{text}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--emma-violet)]">{cta}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
      </Link>
    </li>
  );
}

function ActivatePortal() {
  const { summary } = useAccount();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [biz, setBiz] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function activate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).rpc("activate_client_portal", { _full_name: name, _business_name: biz });
    setBusy(false);
    if (err) return setError(friendlyAuthError(err));
    refreshAccount(); navigate({ to: "/portal" });
  }
  return (
    <div className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-card p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Lock className="h-4 w-4" aria-hidden="true" /></span>
      <span className="mt-3 font-display text-base font-bold">Client portal</span>
      {!open ? (
        <>
          <span className="mt-1 flex-1 text-sm text-muted-foreground">Working with us on a project? Open your portal with this same account.</span>
          <button type="button" onClick={() => setOpen(true)} disabled={summary?.email_verified === false} className="mt-3 inline-flex items-center gap-1 self-start text-sm font-semibold text-[var(--emma-violet)] disabled:opacity-50">Open my client portal<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
          {summary?.email_verified === false && <span className="mt-1 text-xs text-muted-foreground">Confirm your email address first.</span>}
        </>
      ) : (
        <form onSubmit={activate} className="mt-2 space-y-2">
          <div><label htmlFor="ap-name" className="text-xs font-medium">Your name</label><input id="ap-name" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" /></div>
          <div><label htmlFor="ap-biz" className="text-xs font-medium">Business name</label><input id="ap-biz" className="input mt-1" value={biz} onChange={(e) => setBiz(e.target.value)} maxLength={120} autoComplete="organization" /></div>
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Open portal</button>
        </form>
      )}
    </div>
  );
}

function ChangePassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (pw.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    if (pw !== pw2) return setMsg({ ok: false, text: "The passwords don't match." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg({ ok: false, text: friendlyAuthError(error) }); else { setPw(""); setPw2(""); setMsg({ ok: true, text: "Password updated for your whole account." }); }
  }
  return (
    <section aria-labelledby="pw-h" className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 id="pw-h" className="flex items-center gap-2 font-display text-lg font-bold"><KeyRound className="h-4 w-4 text-[var(--emma-violet)]" aria-hidden="true" />Password</h2>
      <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="acc-pw" className="text-sm font-medium">New password</label><input id="acc-pw" type="password" autoComplete="new-password" className="input mt-1" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} /></div>
        <div><label htmlFor="acc-pw2" className="text-sm font-medium">Repeat new password</label><input id="acc-pw2" type="password" autoComplete="new-password" className="input mt-1" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} /></div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || !pw} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Update password</button>
          {msg && <span role={msg.ok ? "status" : "alert"} className={`inline-flex items-center gap-1 text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.ok && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}{msg.text}</span>}
        </div>
      </form>
    </section>
  );
}
