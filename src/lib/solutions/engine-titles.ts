import type { EngineId } from "./types";

/** Short names for each demo type (kept separate from the React registry so data files stay server-safe). */
export const ENGINE_TITLES: Record<EngineId, string> = {
  crm: "Sales pipeline", kanban: "Board", booking: "Booking flow", inventory: "Data table", invoice: "Document builder", helpdesk: "Support desk",
  store: "Storefront", dashboard: "Dashboard", assistant: "Assistant", course: "Learning portal", extract: "Extraction tool", workflow: "Automation",
  writer: "Content tool", feed: "Community", listings: "Listings", tracker: "Tracking", sitebuilder: "Website preview", scoring: "Scoring tool", form: "Smart form", billing: "Subscriptions",
};
