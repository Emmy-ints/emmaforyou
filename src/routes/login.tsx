import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KineticText } from "@/components/future/Kinetic";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccountAuthForm, { friendlyAuthError, type AuthMode } from "@/components/auth/AccountAuthForm";
import Wordmark from "@/components/brand/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { safeNext } from "@/lib/auth/redirect";
import { useAccount } from "@/lib/auth/use-account";
import { pageHead } from "@/lib/seo";

type Mode = AuthMode | "reset";
export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode; next?: string } => ({
    ...(typeof s.mode === "string" && ["signin", "signup", "forgot", "reset"].includes(s.mode) ? { mode: s.mode as Mode } : {}),
    ...(typeof s.next === "string" ? { next: safeNext(s.next) } : {}),
  }),
  head: () => pageHead({ title: "Sign in or create your account — EmmaForYou", description: "One EmmaForYou account for the community, the client portal and every protected area of the site.", path: "/login", noindex: true }),
  component: LoginPage,
});

function LoginPage() {
  const { mode = "signin", next } = Route.useSearch();
  const navigate = useNavigate();
  const { ready, signedIn, email } = useAccount();
  const dest = safeNext(next);
  const [recovery, setRecovery] = useState(mode === "reset");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  // Already signed in (or just signed in from an email link): continue to where they were going.
  useEffect(() => {
    if (ready && signedIn && !recovery && next) navigate({ to: dest as "/account" });
  }, [ready, signedIn, recovery, next, dest, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="relative overflow-hidden px-5 pb-20 pt-28 sm:pt-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_srgb,var(--emma-violet)_16%,transparent),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center"><Wordmark /></div>
          <div className="auth-stage relative">
          <div className="auth-orb" aria-hidden="true"><div className="efy-orb-fallback" /></div>
          <div className="auth-card lg-strong relative rounded-[30px] p-6 sm:p-8">
            {!ready ? (
              <div className="flex justify-center py-10" role="status"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" /><span className="sr-only">Loading</span></div>
            ) : recovery ? (
              <NewPassword onDone={() => { setRecovery(false); navigate({ to: dest as "/account" }); }} />
            ) : signedIn ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" aria-hidden="true" />
                <h1 className="mt-3 font-display text-2xl font-bold"><KineticText text="You're signed in" base={60} /></h1>
                <p className="mt-1 text-sm text-muted-foreground">as <span className="font-medium text-foreground">{email}</span></p>
                <div className="mt-6 grid gap-2">
                  <Link to="/account" className="btn-primary-gradient rounded-full px-5 py-3 text-sm font-semibold text-white">Go to your account</Link>
                  <div className="grid grid-cols-2 gap-2"><Link to="/community" className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Community</Link><Link to="/portal" className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Client portal</Link></div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold">{mode === "signup" ? "Create your EmmaForYou account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
                <p className="mb-5 mt-1 text-sm text-muted-foreground">{mode === "forgot" ? "Enter your email and we'll send you a link to choose a new password." : "One account for the community, your client portal and everything else on EmmaForYou."}</p>
                <AccountAuthForm key={mode} initialMode={mode === "reset" ? "signin" : mode} intent={dest.startsWith("/portal") ? "portal" : dest.startsWith("/community") ? "community" : "account"} next={dest} idPrefix="login" onSignedIn={() => navigate({ to: dest as "/account" })} />
              </>
            )}
          </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Need help signing in? <Link to="/contact" className="underline">Contact us</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function NewPassword({ onDone }: { onDone: () => void }) {
  const { signedIn } = useAccount();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError("Choose a longer password: at least 8 characters.");
    if (pw !== pw2) return setError("The two passwords don't match.");
    setBusy(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (err) setError(friendlyAuthError(err)); else onDone();
  }
  if (!signedIn) return (
    <div className="text-center">
      <h1 className="font-display text-2xl font-bold"><KineticText text="This reset link has expired" base={60} /></h1>
      <p className="mt-2 text-sm text-muted-foreground">Reset links work once and for a limited time. Ask for a new one.</p>
      <Link to="/login" search={{ mode: "forgot" }} className="btn-primary-gradient mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white">Send a new link</Link>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-3">
      <h1 className="font-display text-2xl font-bold"><KineticText text="Choose a new password" base={60} /></h1>
      <p className="text-sm text-muted-foreground">It changes your password for the whole site: community, client portal and dashboard.</p>
      <div><label htmlFor="np1" className="text-sm font-medium">New password</label><input id="np1" type="password" autoComplete="new-password" className="input mt-1" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required /></div>
      <div><label htmlFor="np2" className="text-sm font-medium">Repeat new password</label><input id="np2" type="password" autoComplete="new-password" className="input mt-1" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required /></div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary-gradient flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Save new password</button>
    </form>
  );
}
