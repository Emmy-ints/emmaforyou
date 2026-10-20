import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { report } from "@/lib/community/api";

const REASONS = [
  ["spam", "Spam or scam"], ["harassment", "Harassment or bullying"], ["hate", "Hate speech"],
  ["misinformation", "False or misleading"], ["inappropriate", "Inappropriate content"], ["other", "Something else"],
] as const;

/** Sends a report to the moderation queue. One report per member per item (enforced by the database). */
export default function ReportDialog({ uid, targetType, targetId, onClose }: { uid: string; targetType: "post" | "comment" | "profile"; targetId: string; onClose: () => void }) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"" | "sent" | "already">("");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason || busy) return;
    setBusy(true); setError("");
    try { setDone(await report(uid, targetType, targetId, reason, details)); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't send the report. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[94vw] max-w-md">
        <DialogTitle>Report this {targetType === "profile" ? "member" : targetType}</DialogTitle>
        <DialogDescription>Reports go to the EmmaForYou community team. The member isn't told who reported them.</DialogDescription>
        {done ? (
          <div role="status" className="space-y-3">
            <p className="text-sm">{done === "sent" ? "Thanks. Our team will review it." : "You've already reported this. Our team will review it."}</p>
            <button type="button" onClick={onClose} className="btn-primary-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-white">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <fieldset className="space-y-1.5">
              <legend className="mb-1 text-sm font-medium">Why are you reporting it?</legend>
              {REASONS.map(([id, label]) => (
                <label key={id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm has-[:checked]:border-[var(--emma-violet)]">
                  <input type="radio" name="reason" value={id} checked={reason === id} onChange={() => setReason(id)} className="accent-[var(--emma-violet)]" />{label}
                </label>
              ))}
            </fieldset>
            <label className="block text-sm font-medium">Anything else? (optional)<textarea className="input mt-1" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={!reason || busy} className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Send report</button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
