import { supabase } from "@/integrations/supabase/client";

/**
 * First-party analytics. Events go straight to the `site_events` table (insert-only for visitors,
 * readable only by admins). No cookies and no third-party scripts: a random id in sessionStorage
 * groups one visit's events together and disappears when the tab is closed.
 */

export type AnalyticsEvent =
  | "page_view"
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "cta_click"
  | "prototype_generated"
  | "prototype_refined"
  | "prototype_failed"
  | "prototype_limit_hit"
  | "prototype_build_real_click"
  | "lead_submitted"
  | "intake_submitted"
  | "roi_calculated"
  | "quiz_completed"
  | "magnet_downloaded"
  | "affiliate_signup"
  | "service_tile_click"
  | "receptionist_message"
  | "receptionist_booking"
  | "voice_used"
  | "audit_run"
  | "audit_requested"
  | "proposal_generated"
  | "proposal_accepted"
  | "makeover_generated"
  | "call_booked"
  | "voice_search"
  | "page_translated"
  | "contract_checked"
  | "plan_generated"
  | "assistant_message"
  | "assistant_lead"
  | "exit_offer_shown"
  | "exit_offer_clicked"
  | "sticky_cta_click"
  | "newsletter_subscribed"
  | "review_submitted";

type Props = Record<string, string | number | boolean | null | undefined>;

const SESSION_KEY = "efy_sid";
const ATTRIBUTION_KEY = "efy_attr";
const OPT_OUT_KEY = "efy_no_track";

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSet(storage: Storage | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value);
  } catch {
    /* storage can be blocked; analytics must never break the page */
  }
}

function sessionId(): string {
  const existing = safeGet(window.sessionStorage, SESSION_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  safeSet(window.sessionStorage, SESSION_KEY, id);
  return id;
}

interface Attribution {
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

/** Where this visit came from, captured once at the start of the session. */
function attribution(): Attribution {
  const saved = safeGet(window.sessionStorage, ATTRIBUTION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as Attribution;
    } catch {
      /* fall through and recompute */
    }
  }
  const params = new URLSearchParams(window.location.search);
  let referrer: string | null = null;
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      referrer = host && host !== window.location.hostname ? host.replace(/^www\./, "") : null;
    }
  } catch {
    referrer = null;
  }
  const clip = (v: string | null) => (v ? v.slice(0, 100) : null);
  const value: Attribution = {
    referrer,
    utm_source: clip(params.get("utm_source") || params.get("ref")),
    utm_medium: clip(params.get("utm_medium")),
    utm_campaign: clip(params.get("utm_campaign")),
  };
  safeSet(window.sessionStorage, ATTRIBUTION_KEY, JSON.stringify(value));
  return value;
}

function device(): string {
  const w = window.innerWidth;
  return w < 768 ? "mobile" : w < 1100 ? "tablet" : "desktop";
}

function trackingDisabled(): boolean {
  if (safeGet(window.localStorage, OPT_OUT_KEY) === "1") return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (navigator.doNotTrack === "1" || nav.globalPrivacyControl === true) return true;
  // Don't count the owner's own visits to the private dashboard.
  return window.location.pathname.startsWith("/dashboard");
}

let lastPageView = "";

export function track(event: AnalyticsEvent, props: Props = {}): void {
  if (!isBrowser() || trackingDisabled()) return;
  try {
    const path = window.location.pathname.slice(0, 300);
    if (event === "page_view") {
      if (lastPageView === path) return;
      lastPageView = path;
    }
    const cleanProps: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null) continue;
      cleanProps[k.slice(0, 40)] = typeof v === "string" ? v.slice(0, 200) : v;
    }
    const attr = attribution();
    void supabase
      .from("site_events")
      .insert({
        event,
        path,
        session_id: sessionId(),
        referrer: attr.referrer,
        utm_source: attr.utm_source,
        utm_medium: attr.utm_medium,
        utm_campaign: attr.utm_campaign,
        device: device(),
        language: (document.documentElement.lang || "en").slice(0, 8),
        props: cleanProps,
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    /* never let analytics break the site */
  }
}

/**
 * One listener for the whole site: counts clicks on WhatsApp, phone and email links,
 * plus any element marked with data-track="name".
 */
export function installClickTracking(): () => void {
  if (!isBrowser()) return () => undefined;
  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target || typeof target.closest !== "function") return;
    const marked = target.closest<HTMLElement>("[data-track]");
    if (marked?.dataset.track) {
      track("cta_click", { name: marked.dataset.track, label: (marked.textContent || "").trim().slice(0, 80) });
    }
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    const label = (link.textContent || link.getAttribute("aria-label") || "").trim().slice(0, 80);
    if (/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(href)) track("whatsapp_click", { label });
    else if (href.startsWith("tel:")) track("phone_click", { label });
    else if (href.startsWith("mailto:")) track("email_click", { label });
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
