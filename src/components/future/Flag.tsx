import type { ReactNode } from "react";
import { FEATURES, useFlag } from "@/lib/site-settings";

/** Renders its children unless the owner switched this feature off in the control room. */
export function Flag({ id, children }: { id: string; children: ReactNode }) {
  const def = FEATURES.find((f) => f.id === id)?.default ?? true;
  return useFlag(id, def) ? <>{children}</> : null;
}
