import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import { supabase } from "@/integrations/supabase/client";

const rpc = supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/unsubscribe")({
  component: Page,
  validateSearch: (s: Record<string, unknown>) => ({ t: typeof s.t === "string" ? s.t : undefined }),
  head: () => ({ meta: [{ title: "Unsubscribe — EmmaForYou" }, { name: "robots", content: "noindex, nofollow" }] }),
});

function Page() {
  const { t } = Route.useSearch();
  const [token] = useState(t);
  const [state, setState] = useState<"ready" | "busy" | "done" | "invalid" | "error">(token && UUID.test(token) ? "ready" : "invalid");

  // Remove the token from the address bar so it isn't kept in history or shared by accident.
  useEffect(() => { try { if (token) window.history.replaceState(window.history.state, "", "/unsubscribe"); } catch { /* ignore */ } }, [token]);

  async function confirm() {
    if (!token) return;
    setState("busy");
    const { data, error } = await rpc.rpc("newsletter_unsubscribe", { p_token: token });
    setState(error ? "error" : data === true ? "done" : "invalid");
  }

  return (
    <ToolShell eyebrow="Newsletter" title="Unsubscribe" intro="Stop receiving the EmmaForYou newsletter." width="max-w-2xl">
      <div className="rounded-[22px] border border-border bg-card p-6" role="status">
        {state === "ready" && (<><p>Click below to unsubscribe this email address. You won't receive any more newsletter emails.</p><button onClick={confirm} className="btn-primary-gradient mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white">Unsubscribe me</button></>)}
        {state === "busy" && <p>Unsubscribing…</p>}
        {state === "done" && <p><strong>You've been unsubscribed.</strong> Sorry to see you go. If this was a mistake, you can <Link to="/newsletter" className="font-semibold text-[var(--emma-violet)]">subscribe again</Link>.</p>}
        {state === "invalid" && <p>This unsubscribe link isn't valid or has already been used. Use the link from your most recent email, or <Link to="/contact" className="font-semibold text-[var(--emma-violet)]">contact us</Link> and we'll remove you.</p>}
        {state === "error" && <p>Something went wrong. Please try again, or <Link to="/contact" className="font-semibold text-[var(--emma-violet)]">contact us</Link> and we'll remove you.</p>}
      </div>
    </ToolShell>
  );
}
