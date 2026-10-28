import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import SectionHead from "./future/SectionHead";
import { catalog, withOverrides } from "@/lib/service-catalog";
import { useSettings } from "@/lib/site-settings";

export type Kind = "ai" | "web" | "email" | "social" | "ads" | "ecom" | "app" | "ux" | "web3" | "book";

const SERVICES: { kind: Kind; slug: string; id: string; name: string; desc: string; tags: string[]; to?: string }[] = [
  { kind: "ai", slug: "ai-automation", id: "service-ai", name: "AI Automation", desc: "Automate follow-ups, bookings, and lead nurturing with intelligent AI systems that work 24/7.", tags: ["WhatsApp & chat agents", "Bookings", "Follow-up"] },
  { kind: "web", slug: "website-design", id: "service-web", name: "Website Design & Dev", desc: "Stunning, conversion-optimized websites that build credibility and capture leads on autopilot.", tags: ["Design", "Development", "SEO-ready"] },
  { kind: "email", slug: "email-marketing", id: "service-email", name: "Email Marketing", desc: "High-converting email sequences that nurture leads, recover abandoned carts, and drive repeat sales.", tags: ["Sequences", "Newsletters"] },
  { kind: "social", slug: "social-media", id: "service-social", name: "Social Media Management", desc: "Consistent, engaging content that grows your audience and turns followers into paying customers.", tags: ["Content", "Community"] },
  { kind: "ads", slug: "ad-marketing", id: "service-ads", name: "Ad Marketing", desc: "Targeted ad campaigns on Google, Facebook, and Instagram that deliver measurable ROI.", tags: ["Meta", "Google"] },
  { kind: "ecom", slug: "ecommerce", id: "service-ecommerce", name: "Ecommerce Growth", desc: "End-to-end ecommerce solutions from Shopify setup to conversion optimization and scaling.", tags: ["Shopify", "Conversion"] },
  { kind: "app", slug: "app-development", id: "service-app", name: "App Development", desc: "Custom mobile and web applications that streamline operations and delight your customers.", tags: ["Mobile", "Web apps", "Dashboards"] },
  { kind: "ux", slug: "ui-ux-design", id: "service-uiux", name: "UI/UX Design", desc: "Interfaces people understand at first glance: research, wireframes, prototypes and design systems for websites and apps.", tags: ["Research", "Prototypes", "Design systems"], to: "/expertise/ui-ux-design" },
  { kind: "web3", slug: "web3-development", id: "service-web3", name: "Web3 & Blockchain", desc: "dApps, wallet connections, Solidity smart contracts and crypto projects with a Web2-quality experience.", tags: ["dApps", "Solidity", "Wallets"], to: "/expertise/web3-development" },
  { kind: "book", slug: "ebook-publishing", id: "service-ebook", name: "eBook Publishing & Marketing", desc: "Manuscripts turned into professional eBooks and paperbacks: formatting, cover design, 3D mockups, listing copy, launch plans and book marketing.", tags: ["eBook creation", "Cover design", "Mockups", "Book marketing"] },
];

/**
 * Services as a bento of seven distinct worlds: each service has its own colour and a small live
 * scene (pure SVG + CSS) that shows what it does — an AI network passing messages, a page being
 * assembled, emails in flight, posts fanning out, ad bars rising, a basket filling, app screens
 * swiping. Cards tilt towards the pointer; scenes stand still with reduced motion.
 */
export default function ServicesSection() {
  const settings = useSettings();
  const count = withOverrides(catalog(), settings).length;
  const shown = SERVICES.map((s) => { const o = settings[`service:svc-${s.slug}`] ?? (s.to ? settings[`service:exp-${s.slug}`] : undefined); return o?.hidden ? null : { ...s, name: o?.name || s.name, desc: o?.short || s.desc }; }).filter(Boolean) as typeof SERVICES;
  return (
    <section id="services" className="sv section-padding" aria-labelledby="sv-h">
      <div className="mx-auto max-w-7xl">
        <SectionHead id="sv-h" align="center" className="max-w-3xl" kicker="What we do" title="Everything Your Business Needs to Dominate Online" shine={["Dominate", "Online"]}
          sub="From AI automation to full-stack web development — we deliver the digital infrastructure your business needs to grow." />

        <ul className="sv-bento grid mt-14">
          {shown.map((s) => (
            <li key={s.slug} id={s.id} className={`sv-card sv-${s.kind}`} data-tilt="4">
              <div className="sv-scene" aria-hidden="true"><Scene kind={s.kind} /></div>
              <div className="sv-body">
                <h3 className="font-display text-lg font-semibold text-foreground md:text-xl">
                  {s.to ? <Link to={s.to} className="sv-link">{s.name}</Link> : <Link to="/services/$slug" params={{ slug: s.slug }} className="sv-link">{s.name}</Link>}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${s.name} includes`}>
                  {s.tags.map((t) => <li key={t} className="sv-tag">{t}</li>)}
                </ul>
                <span className="sv-more">Learn more about {s.name} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <a href="#service-explorer" className="nav-ghost h-auto px-6 py-3">See all {count} services, expertise areas and solutions <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}

/** The small live scene for each service (also used in the service page heroes). */
export function Scene({ kind }: { kind: Kind }) {
  switch (kind) {
    case "ai":
      return (
        <svg viewBox="0 0 320 180" className="sv-svg">
          {[[40, 50], [40, 130], [160, 30], [160, 90], [160, 150], [280, 60], [280, 120]].map(([x, y], i) => <circle key={i} className="sv-node" cx={x} cy={y} r={i === 3 ? 14 : 7} style={{ ["--i" as string]: i }} />)}
          {["M40 50 L160 30", "M40 50 L160 90", "M40 130 L160 90", "M40 130 L160 150", "M160 30 L280 60", "M160 90 L280 60", "M160 90 L280 120", "M160 150 L280 120"].map((d, i) => (
            <g key={d}><path className="sv-edge" d={d} /><path className="sv-pulse" d={d} pathLength={1} style={{ ["--i" as string]: i }} /></g>
          ))}
        </svg>
      );
    case "web":
      return (
        <div className="svw">
          <div className="svw-bar"><i /><i /><i /><b /></div>
          <div className="svw-hero"><span /><span /><em /></div>
          <div className="svw-cols"><span /><span /><span /></div>
        </div>
      );
    case "email":
      return (
        <div className="sve">
          {[0, 1, 2].map((i) => <span key={i} className="sve-env" style={{ ["--i" as string]: i }}><svg viewBox="0 0 40 28"><rect x="1" y="1" width="38" height="26" rx="5" /><path d="M2 3 L20 16 L38 3" /></svg></span>)}
          <span className="sve-inbox" />
        </div>
      );
    case "social":
      return (
        <div className="svs">
          {[0, 1, 2].map((i) => <span key={i} className="svs-post" style={{ ["--i" as string]: i }}><i /><b /></span>)}
          {[0, 1, 2, 3].map((i) => <span key={i} className="svs-heart" style={{ ["--i" as string]: i }}>♥</span>)}
        </div>
      );
    case "ads":
      return (
        <div className="sva">
          {[38, 52, 46, 70, 64, 88].map((h, i) => <span key={i} style={{ ["--h" as string]: `${h}%`, ["--i" as string]: i }} />)}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none"><path pathLength={1} d="M2 34 L20 28 L36 30 L52 18 L70 20 L96 6" /></svg>
        </div>
      );
    case "ecom":
      return (
        <div className="svc">
          {[0, 1, 2].map((i) => <span key={i} className="svc-item" style={{ ["--i" as string]: i }} />)}
          <span className="svc-bag"><svg viewBox="0 0 48 48"><path d="M10 16 h28 l-3 26 h-22 z" /><path d="M18 16 a6 6 0 0 1 12 0" /></svg></span>
        </div>
      );
    case "ux":
      return (
        <div className="svu">
          <span className="svu-frame"><i /><i /><i /><b /></span>
          <span className="svu-cursor" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 3l7 17 2.5-7.5L21 10z" /></svg></span>
        </div>
      );
    case "web3":
      return (
        <div className="svb">
          {[0, 1, 2, 3].map((i) => <span key={i} className="svb-block" style={{ ["--i" as string]: i }}><i /></span>)}
        </div>
      );
    case "book":
      return (
        <div className="svk">
          <span className="svk-book"><span className="svk-page" /><span className="svk-page" /><span className="svk-page" /><span className="svk-cover"><i /><b /></span></span>
          {[0, 1, 2].map((i) => <span key={i} className="svk-spark" style={{ ["--i" as string]: i }} />)}
        </div>
      );
    case "app":
      return (
        <div className="svp">
          <span className="svp-phone"><span className="svp-screens"><i /><i /><i /></span></span>
          <span className="svp-phone svp-back" />
        </div>
      );
  }
}
