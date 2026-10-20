import { useState, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

/**
 * Community sign-in / sign-up. Sign-ups are tagged signup_source=community so the database does
 * not turn them into client-portal accounts. Any component can ask a visitor to join via openAuth().
 */
type Mode = "signin" | "signup" | "forgot";
let open: { mode: Mode; reason: string } | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
export function openAuth(reason = "Join the EmmaForYou Community to take part.", mode: Mode = "signup") { open = { mode, reason }; emit(); }
function close() { open = null; emit(); }

export function AuthDialogHost() {
  const state = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => open, () => null);
  return <Dialog open={Boolean(state)} onOpenChange={(o) => { if (!o) close(); }}>{state && <AuthForm key={state.mode + state.reason} initial={state.mode} reason={state.reason} />}</Dialog>;
}

function AuthForm({ initial, reason }: { initial: Mode; reason: string }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setInfo("");
    try {
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/community/settings`, data: { signup_source: "community", full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) close();
        else setInfo("Check your email and tap the confirmation link. You'll come straight back to set up your profile.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        close();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/community/settings` });
        if (error) throw error;
        setInfo("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setError(/Invalid login/i.test(m) ? "That email and password don't match." : /registered/i.test(m) ? "That email already has an account. Sign in instead." : /rate|limit/i.test(m) ? "Too many attempts. Please wait a minute." : m || "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  const title = mode === "signup" ? "Join the Community" : mode === "signin" ? "Sign in" : "Reset your password";
  return (
    <DialogContent className="w-[94vw] max-w-md">
      <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
      <DialogDescription>{mode === "forgot" ? "We'll email you a link to choose a new password." : reason}</DialogDescription>
      <form onSubmit={submit} className="mt-2 space-y-3" noValidate>
        {mode === "signup" && <label className="block text-sm font-medium">Your name<input className="input mt-1" autoComplete="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></label>}
        <label className="block text-sm font-medium">Email<input className="input mt-1" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode !== "forgot" && <label className="block text-sm font-medium">Password<input className="input mt-1" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
        {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {info && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{info}</p>}
        <button type="submit" disabled={busy || !email || (mode !== "forgot" && !password) || (mode === "signup" && !name.trim())} className="btn-primary-gradient flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{mode === "signup" ? "Create my account" : mode === "signin" ? "Sign in" : "Send reset link"}
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        {mode === "signup" ? <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => setMode("signin")}>I already have an account</button>
          : <button type="button" className="font-semibold text-foreground hover:underline" onClick={() => setMode("signup")}>Create an account</button>}
        {mode === "signin" && <button type="button" className="hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>}
      </div>
      {mode === "signup" && <p className="text-xs text-muted-foreground">By joining you agree to the <Link to="/community/guidelines" onClick={close} className="underline">Community guidelines</Link>, <Link to="/terms" onClick={close} className="underline">Terms</Link> and <Link to="/privacy" onClick={close} className="underline">Privacy policy</Link>.</p>}
    </DialogContent>
  );
}
