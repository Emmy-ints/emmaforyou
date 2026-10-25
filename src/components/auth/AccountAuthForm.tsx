import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loginUrl, safeNext } from "@/lib/auth/redirect";

/**
 * The one EmmaForYou sign-in form, used by /login, the community, the client portal and the owner
 * dashboard. Every area uses the same account (Supabase Auth on this site) and the same session,
 * so signing in here signs you in everywhere and signing out anywhere signs you out everywhere.
 *
 * intent only changes what a brand-new account is set up with:
 *   portal    → also creates the client-portal record (as portal sign-ups always have)
 *   community → no client record (it can be opened later from /account)
 *   account   → same as community
 */
export type AuthMode = "signin" | "signup" | "forgot";
export type AuthIntent = "account" | "community" | "portal";

const field = "mt-1 block w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[0.95rem] text-foreground outline-none transition focus:border-[var(--emma-violet)] focus:ring-4 focus:ring-[var(--emma-violet)]/15";

export function friendlyAuthError(err: unknown): string {
  const m = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/invalid login|invalid credentials/i.test(m)) return "That email and password don't match. Check them, or reset your password.";
  if (/email not confirmed/i.test(m)) return "Please confirm your email first: open the link we sent you. You can send it again below.";
  if (/already registered|already exists/i.test(m)) return "That email already has an EmmaForYou account. Sign in instead, or reset your password.";
  if (/rate|limit|too many/i.test(m)) return "Too many attempts. Please wait a minute and try again.";
  if (/password.*(short|least|weak)/i.test(m)) return "Choose a longer password: at least 8 characters.";
  if (/network|fetch/i.test(m)) return "We couldn't reach the server. Check your connection and try again.";
  return m || "Something went wrong. Please try again.";
}

export default function AccountAuthForm({ initialMode = "signin", intent = "account", next, onSignedIn, idPrefix = "auth" }: {
  initialMode?: AuthMode; intent?: AuthIntent; next?: string; onSignedIn?: () => void; idPrefix?: string;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [canResend, setCanResend] = useState(false);
  const dest = safeNext(next, intent === "portal" ? "/portal" : intent === "community" ? "/community" : "/account");

  const switchTo = (m: AuthMode) => { setMode(m); setError(""); setInfo(""); setCanResend(false); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setInfo(""); setCanResend(false);
    try {
      const mail = email.trim().toLowerCase();
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Choose a longer password: at least 8 characters.");
        const { data, error: err } = await supabase.auth.signUp({
          email: mail, password,
          options: {
            emailRedirectTo: loginUrl({ next: dest }),
            data: { full_name: name.trim(), ...(intent === "portal" ? { business_name: business.trim() } : { signup_source: intent === "community" ? "community" : "account" }) },
          },
        });
        if (err) throw err;
        // With email confirmation on, an address that is already registered comes back with no identities.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setMode("signin");
          throw new Error("That email already has an EmmaForYou account. Sign in instead, or reset your password.");
        }
        if (data.session) { onSignedIn?.(); return; }
        setInfo(`We've sent a confirmation link to ${mail}. Open it to finish creating your account; you'll be signed in and brought back here.`);
        setCanResend(true);
      } else if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (err) { if (/email not confirmed/i.test(err.message)) setCanResend(true); throw err; }
        onSignedIn?.();
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: loginUrl({ mode: "reset", next: dest }) });
        if (err) throw err;
        setInfo("If that email has an account, a reset link is on its way. Open it on this device to choose a new password.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally { setBusy(false); }
  }

  async function resend() {
    setBusy(true); setError("");
    const { error: err } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo: loginUrl({ next: dest }) } });
    setBusy(false);
    if (err) setError(friendlyAuthError(err)); else setInfo("Confirmation email sent again. Check your inbox and spam folder.");
  }

  const id = (s: string) => `${idPrefix}-${s}`;
  const submitLabel = mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link";
  return (
    <div>
      {mode !== "forgot" && (
        <div role="group" aria-label="Sign in or create an account" data-mode={mode} className="auth-seg mb-4 grid grid-cols-2 rounded-full border border-border bg-muted/50 p-1 text-sm font-semibold">
          {(["signin", "signup"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchTo(m)}
              className={`relative z-[1] whitespace-nowrap rounded-full px-2 py-2 text-[13px] transition-colors min-[360px]:text-sm ${mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}
      <form key={mode} onSubmit={submit} className="auth-form space-y-3" noValidate>
        {mode === "signup" && (
          <div><label htmlFor={id("name")} className="text-sm font-medium">Your name</label><input id={id("name")} className={field} autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        {mode === "signup" && intent === "portal" && (
          <div><label htmlFor={id("biz")} className="text-sm font-medium">Business name</label><input id={id("biz")} className={field} autoComplete="organization" required maxLength={120} value={business} onChange={(e) => setBusiness(e.target.value)} /></div>
        )}
        <div><label htmlFor={id("email")} className="text-sm font-medium">Email</label><input id={id("email")} className={field} type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between"><label htmlFor={id("pw")} className="text-sm font-medium">Password</label>
              {mode === "signin" && <button type="button" onClick={() => switchTo("forgot")} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">Forgot password?</button>}</div>
            <input id={id("pw")} className={field} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={mode === "signup" ? id("pw-help") : undefined} />
            {mode === "signup" && <p id={id("pw-help")} className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>}
          </div>
        )}
        {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
        {info && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{info}</p>}
        <button type="submit" disabled={busy || !email.trim() || (mode !== "forgot" && !password) || (mode === "signup" && (!name.trim() || (intent === "portal" && !business.trim())))}
          className="btn-primary-gradient flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{submitLabel}
        </button>
        {canResend && <button type="button" onClick={resend} disabled={busy || !email.trim()} className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">Send the confirmation email again</button>}
        {mode === "forgot" && <button type="button" onClick={() => switchTo("signin")} className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">Back to sign in</button>}
      </form>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        One EmmaForYou account works for the community, the client portal and every other area of this site.
        {mode === "signup" && <> By creating an account you agree to our <Link to="/terms" className="underline">Terms</Link>, <Link to="/privacy" className="underline">Privacy policy</Link>{intent === "community" && <> and <Link to="/community/guidelines" className="underline">Community guidelines</Link></>}.</>}
      </p>
    </div>
  );
}
