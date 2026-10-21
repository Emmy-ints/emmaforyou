import { useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import AccountAuthForm from "../auth/AccountAuthForm";
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
  const title = initial === "signup" ? "Join the Community" : initial === "signin" ? "Sign in" : "Reset your password";
  return (
    <DialogContent className="w-[94vw] max-w-md">
      <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
      <DialogDescription>{initial === "forgot" ? "We'll email you a link to choose a new password." : reason}</DialogDescription>
      <AccountAuthForm initialMode={initial} intent="community" next={typeof window !== "undefined" ? window.location.pathname : "/community"} idPrefix="community-auth" onSignedIn={close} />
      <p className="text-xs text-muted-foreground">Prefer a full page? <Link to="/login" onClick={close} className="underline">Open the sign-in page</Link>.</p>
    </DialogContent>
  );
}
