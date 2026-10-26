import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, MessageCircle, Sparkles } from "lucide-react";
import ToolShell from "../components/tools/ToolShell";
import FounderCard from "../components/future/FounderCard";
import ContactForm from "../components/tools/ContactForm";
import { pageHead, breadcrumbLd, WHATSAPP_URL, ORG_ID, absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  component: Page,
  head: () =>
    pageHead({
      title: "Contact EmmaForYou — WhatsApp, Book a Call or Send a Message",
      description: "Talk to EmmaForYou: message Emmanuel on WhatsApp, book a free 30-minute strategy call, ask our AI assistant, or send a message and we'll reply.",
      path: "/contact",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]),
        { "@context": "https://schema.org", "@type": "ContactPage", url: absoluteUrl("/contact"), about: { "@id": ORG_ID } },
      ],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Contact"
      title="Let's talk about your business"
      intro="The fastest way to reach us is WhatsApp. Prefer to plan ahead? Book a free call. Or send a message below and we'll reply on WhatsApp or email."
      answers={[
        { q: "How fast do you reply?", a: "We aim to reply to WhatsApp messages within hours during working days. Emma, our AI assistant, answers questions instantly at any time." },
        { q: "Where are you based?", a: "EmmaForYou is headquartered in Nigeria and works with clients in the USA, the UK, Europe and across Africa by video call and WhatsApp." },
      ]}
      width="max-w-5xl"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <div className="lg-strong rounded-[22px] p-5"><FounderCard line="Every message reaches me, not a call centre. Tell me what you're working on and I'll reply personally." /></div>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 rounded-[20px] border border-border bg-card p-5 hover:border-[var(--emma-violet)]">
            <MessageCircle className="h-6 w-6 shrink-0 text-[#25d366]" /><span><span className="block font-semibold">WhatsApp</span><span className="block text-sm text-muted-foreground">Message Emmanuel directly. Best for quick questions and projects.</span></span>
          </a>
          <Link to="/book" className="flex items-start gap-4 rounded-[20px] border border-border bg-card p-5 hover:border-[var(--emma-violet)]">
            <CalendarCheck className="h-6 w-6 shrink-0 text-[var(--emma-violet)]" /><span><span className="block font-semibold">Book a free strategy call</span><span className="block text-sm text-muted-foreground">30 minutes, at a time that suits you. Confirmation by email.</span></span>
          </Link>
          <button onClick={() => window.dispatchEvent(new Event("efy-open-ask"))} className="flex w-full items-start gap-4 rounded-[20px] border border-border bg-card p-5 text-left hover:border-[var(--emma-violet)]">
            <Sparkles className="h-6 w-6 shrink-0 text-[var(--emma-violet)]" /><span><span className="block font-semibold">Ask Emma AI</span><span className="block text-sm text-muted-foreground">Instant answers about services, prices and timelines, any time.</span></span>
          </button>
          <p className="px-1 pt-2 text-sm text-muted-foreground">Existing client? Use the <Link to="/portal" className="font-semibold text-[var(--emma-violet)]">client portal</Link> for messages, approvals and files.</p>
        </div>
        <ContactForm />
      </div>
    </ToolShell>
  );
}
