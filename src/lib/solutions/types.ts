export type EngineId =
  | "crm" | "kanban" | "booking" | "inventory" | "invoice" | "helpdesk" | "store" | "dashboard" | "assistant" | "course"
  | "extract" | "workflow" | "writer" | "feed" | "listings" | "tracker" | "sitebuilder" | "scoring" | "form" | "billing";

export interface Solution {
  slug: string;
  category: string;
  group: string;
  name: string;
  icon: string;
  /** One sentence: what it does. */
  tagline: string;
  /** Who needs it. */
  who: string;
  /** Problems it solves (2–3). */
  problems: string[];
  /** Core features. */
  features: string[];
  /** Advanced features. */
  advanced?: string[];
  /** Extra integrations on top of the group defaults. */
  integrations?: string[];
  /** Extra business benefits on top of the group defaults. */
  benefits?: string[];
  /** Illustrative before/after (not a client result). */
  before: string;
  after: string;
  /** Which working prototype to show, and with which sample data. */
  demo: { engine: EngineId; preset: string };
  /** Real portfolio projects (exact names from portfolio-data) that show related work. */
  clientWork?: string[];
}

export interface GroupDefaults {
  integrations: string[];
  benefits: string[];
}
