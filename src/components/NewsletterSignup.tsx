import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";

const rpc = supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };

export type NewsLang = "en" | "fr" | "de";

const TEXT: Record<NewsLang, { title: string; body: string; name: string; email: string; button: string; done: string; doneBody: string; error: string; privacy: string; privacyLink: string }> = {
  en: {
    title: "Get practical growth notes by email",
    body: "Practical ideas on websites, AI automation, marketing and conversion. No spam; unsubscribe in one click.",
    name: "First name (optional)", email: "Email address", button: "Subscribe",
    done: "You're subscribed.", doneBody: "Thanks! Look out for our next email.",
    error: "That didn't work. Check the email address and try again.",
    privacy: "We use your email only for this newsletter. See our", privacyLink: "privacy policy",
  },
  fr: {
    title: "Recevez nos conseils de croissance par e-mail",
    body: "Des idées concrètes sur les sites web, l'automatisation IA, le marketing et la conversion. Pas de spam ; désinscription en un clic.",
    name: "Prénom (facultatif)", email: "Adresse e-mail", button: "S'abonner",
    done: "Vous êtes inscrit(e).", doneBody: "Merci ! Surveillez votre boîte de réception.",
    error: "Cela n'a pas fonctionné. Vérifiez l'adresse e-mail et réessayez.",
    privacy: "Nous utilisons votre e-mail uniquement pour cette newsletter. Voir notre", privacyLink: "politique de confidentialité",
  },
  de: {
    title: "Praktische Wachstums-Tipps per E-Mail",
    body: "Praktische Ideen zu Websites, KI-Automatisierung, Marketing und Conversion. Kein Spam; Abmeldung mit einem Klick.",
    name: "Vorname (optional)", email: "E-Mail-Adresse", button: "Abonnieren",
    done: "Sie sind angemeldet.", doneBody: "Danke! Achten Sie auf unsere nächste E-Mail.",
    error: "Das hat nicht geklappt. Bitte prüfen Sie die E-Mail-Adresse und versuchen Sie es erneut.",
    privacy: "Wir nutzen Ihre E-Mail nur für diesen Newsletter. Siehe unsere", privacyLink: "Datenschutzerklärung",
  },
};

/** Newsletter sign-up. Subscribes through the `newsletter_subscribe` RPC; the welcome email is sent by the database. */
export default function NewsletterSignup({ source, language = "en", variant = "card" }: { source: string; language?: NewsLang; variant?: "card" | "band" }) {
  const t = TEXT[language];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setState("error"); return; }
    setState("busy");
    const { error } = await rpc.rpc("newsletter_subscribe", { p_email: email.trim(), p_name: name.trim(), p_source: source.slice(0, 60), p_language: language });
    if (error) { setState("error"); return; }
    setState("done");
    track("newsletter_subscribed", { source: source.slice(0, 60), language });
  }

  const wrap = variant === "band"
    ? "rounded-[24px] border border-border bg-muted/60 p-6 md:p-8"
    : "rounded-[22px] border border-border bg-card p-6 shadow-[var(--shadow-card)]";

  return (
    <div className={wrap} lang={language}>
      <div className="md:flex md:items-start md:gap-8">
        <div className="md:flex-1">
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-foreground"><Mail className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" />{t.title}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.body}</p>
        </div>
        {state === "done" ? (
          <p role="status" className="mt-4 flex items-center gap-2 text-sm font-semibold text-foreground md:mt-0 md:flex-1"><CheckCircle2 className="h-5 w-5 text-[var(--emma-violet)]" aria-hidden="true" />{t.done} <span className="font-normal text-muted-foreground">{t.doneBody}</span></p>
        ) : (
          <form onSubmit={submit} className="mt-4 md:mt-0 md:flex-1" noValidate>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`nl-name-${source}`}>{t.name}</label>
              <input id={`nl-name-${source}`} className="input sm:w-36" placeholder={t.name} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="given-name" />
              <label className="sr-only" htmlFor={`nl-email-${source}`}>{t.email}</label>
              <input id={`nl-email-${source}`} className="input flex-1" type="email" required placeholder={t.email} value={email} onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }} maxLength={200} autoComplete="email" />
              <button type="submit" disabled={state === "busy"} className="btn-primary-gradient inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {state === "busy" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{t.button}
              </button>
            </div>
            {state === "error" && <p role="alert" className="mt-2 text-sm text-red-600">{t.error}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{t.privacy} <Link to="/privacy" className="underline">{t.privacyLink}</Link>.</p>
          </form>
        )}
      </div>
    </div>
  );
}
