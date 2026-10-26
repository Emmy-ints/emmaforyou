import { TIERS } from "../pricing-data";
import { clip } from "../seo";
import { ENGINE_TITLES } from "./engine-titles";
import type { Solution } from "./types";
import { ALL_SOLUTIONS } from "./index";

const SUFFIX: Record<string, string> = { websites: "Website", "business-apps": "App", "ai-solutions": "AI", automations: "Automation", "device-apps": "App" };
let DUP: Set<string> | null = null;
/** Names used by more than one solution area (e.g. "Client Portal" as a website and as an app). */
function duplicated(): Set<string> {
  if (DUP) return DUP;
  const seen = new Map<string, number>();
  for (const x of ALL_SOLUTIONS) { const k = x.name.toLowerCase(); seen.set(k, (seen.get(k) ?? 0) + 1); }
  DUP = new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  return DUP;
}

const starter = TIERS.find((t) => t.name === "Starter");

export function solutionSeoTitle(s: Solution): string {
  let base = s.name.replace(/\s*\([^)]*\)/, "");
  // Two areas can share a name; keep titles unique by naming the kind of build.
  const suf = SUFFIX[s.category];
  if (suf && duplicated().has(s.name.toLowerCase()) && !new RegExp(`\\b${suf}\\b`, "i").test(base)) base = `${base} ${suf}`;
  const named = base === s.name.replace(/\s*\([^)]*\)/, "") ? s.name : base;
  const opts = [`${named}: Features & Live Demo`, `${base}: Features & Live Demo`, `${base} — Live Demo`, base];
  return opts.find((t) => t.length <= 60) ?? base.slice(0, 60);
}

export function solutionDescription(s: Solution): string {
  return clip(`${s.tagline} Try the live, customisable demo and see features, integrations and benefits.`, 158);
}

export function solutionFaqs(s: Solution): { q: string; a: string }[] {
  const isWeb = s.category === "websites";
  const isAi = s.category === "ai-solutions";
  return [
    { q: `What does ${s.name.toLowerCase().startsWith("ai") ? "an" : "a"} ${s.name.replace(/\s*\([^)]*\)/, "")} do?`, a: `${s.tagline} Typical features include ${s.features.slice(0, 3).map((f) => f.toLowerCase()).join(", ")}.` },
    { q: "Who is it for?", a: s.who },
    { q: "Is the demo on this page the finished product?", a: `No. It's a working prototype with sample data so you can try the ${ENGINE_TITLES[s.demo.engine].toLowerCase()} and customise it. The version we build for you uses your own data, branding, logins and integrations.` },
    { q: "How long does it take to build?", a: isWeb ? "Standard websites usually take 2–3 weeks; complex e-commerce or custom builds take 4–8 weeks. You get a fixed timeline after a free strategy call." : "It depends on the scope. We start with a short discovery, agree the first version (MVP), and give you a fixed timeline and quote before any build starts." },
    { q: "How much does it cost?", a: `Our published monthly plans start at $${starter?.monthly ?? 99}/month (Starter). One-off builds like this are quoted after a free strategy call, so you only pay for the features you need.` },
    ...(isAi ? [{ q: "Is the AI safe to use with customers?", a: "We limit the AI to your approved information, log every conversation or action, add human approval for anything sensitive, and set usage limits. Outputs that affect money, legal, HR or health decisions are reviewed by a qualified person." }] : []),
    { q: "Can it connect to the tools I already use?", a: `Usually, yes. Common connections include ${(s.integrations ?? []).concat(["WhatsApp", "email", "payments", "your CRM"]).slice(0, 4).join(", ")}. We confirm what's possible for your tools during discovery.` },
  ];
}

export const PROCESS = [
  { title: "Free strategy call", text: "We learn how your business works and what success looks like." },
  { title: "Scope & prototype", text: "We agree the first version and show you a clickable prototype." },
  { title: "Build & integrate", text: "We build it with your branding, data and the tools you already use." },
  { title: "Launch & train", text: "We test on real devices, launch, and show your team how to use it." },
  { title: "Support & improve", text: "Monthly improvements based on usage and results." },
];
