import type { ReactNode } from "react";
import { CLAIM_LABEL, useClaim } from "@/lib/claims";

/** Small label shown next to a claim when the owner chose to label it (e.g. "Unverified", "Sample"). */
export function ClaimTag({ id, className = "" }: { id: string; className?: string }) {
  const c = useClaim(id);
  if (c.display !== "label") return null;
  return <span className={`claim-tag claim-${c.status} ${className}`} title={c.evidence || undefined}>{CLAIM_LABEL[c.status]}</span>;
}

/** Renders the claim as built, with the owner's label, or not at all. */
export function ClaimGate({ id, children }: { id: string; children: ReactNode }) {
  const c = useClaim(id);
  if (c.display === "hide") return null;
  return <>{children}</>;
}
