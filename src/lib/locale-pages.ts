/**
 * Hand-written French and German landing pages for the Toulon and Halle markets.
 * Prices come from pricing-data (TIERS); client names and outcomes come from portfolio-data, verbatim.
 */
export type LocaleCode = "fr" | "de";

export interface LocaleContent {
  code: LocaleCode;
  ogLocale: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  ctaBook: string;
  ctaWhatsApp: string;
  trust: string[];
  servicesTitle: string;
  servicesIntro: string;
  services: { slug: string; name: string; text: string }[];
  englishNote: string;
  processTitle: string;
  process: { title: string; text: string }[];
  workTitle: string;
  workIntro: string;
  /** Project names exactly as in portfolio-data, with a local label. */
  work: { project: string; label: string }[];
  viewProject: string;
  testimonialNote: string;
  testimonialName: string;
  pricingTitle: string;
  pricingIntro: string;
  perMonth: string;
  plansFrom: string;
  tierAudience: Record<string, string>;
  customLabel: string;
  seePricing: string;
  toolsTitle: string;
  tools: { to: string; name: string; text: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
  finalTitle: string;
  finalText: string;
  breadcrumb: string;
}

export const LOCALE_PAGES: Record<LocaleCode, LocaleContent> = {
  fr: {
    code: "fr",
    ogLocale: "fr_FR",
    seoTitle: "EmmaForYou — Agence web, IA et croissance digitale (Toulon)",
    description: "Sites web, automatisation IA sur WhatsApp, e-commerce, publicité et e-mails pour les entreprises de Toulon et de toute la France. Appel stratégique gratuit.",
    eyebrow: "Toulon · France",
    h1: "Plus de clients grâce à un site qui convertit et à l'IA qui répond pour vous",
    intro: "EmmaForYou conçoit des sites web, des boutiques en ligne et des automatisations IA (réponses WhatsApp, réservations, relances) pour les entreprises de Toulon, du Var et de toute la France. Une seule équipe responsable de tout le système, du premier clic jusqu'à la vente.",
    ctaBook: "Réserver un appel gratuit",
    ctaWhatsApp: "Écrire sur WhatsApp",
    trust: ["Sans engagement : forfaits mensuels", "Prix publiés, pas de surprise", "Appel stratégique gratuit de 30 minutes"],
    servicesTitle: "Ce que nous faisons pour vous",
    servicesIntro: "Choisissez un service ou combinez-les. Nous commençons toujours par ce qui vous rapportera des clients le plus vite.",
    services: [
      { slug: "ai-automation", name: "Automatisation IA et WhatsApp", text: "Un assistant IA répond à vos clients 24 h/24 sur WhatsApp, Instagram et votre site, prend les rendez-vous et envoie les rappels." },
      { slug: "website-design", name: "Sites web et landing pages", text: "Des sites rapides sur mobile, clairs et conçus pour transformer les visiteurs en demandes de devis, appels et réservations." },
      { slug: "ecommerce", name: "E-commerce", text: "Boutiques Shopify ou WooCommerce, paiements, relance des paniers abandonnés et e-mails après achat." },
      { slug: "ad-marketing", name: "Publicité Google et Meta", text: "Des campagnes Google, Facebook et Instagram mesurées sur ce qui compte : appels, messages, réservations et ventes." },
      { slug: "email-marketing", name: "E-mail marketing", text: "Séquences de bienvenue, relances et newsletters qui fidélisent vos clients sans effort quotidien." },
      { slug: "social-media", name: "Réseaux sociaux", text: "Contenu régulier et automatisé pour rester visible là où vos clients passent leur temps." },
    ],
    englishNote: "Les pages de détail sont en anglais.",
    processTitle: "Comment nous travaillons",
    process: [
      { title: "1. Appel stratégique", text: "30 minutes pour comprendre votre activité, vos clients et vos objectifs. Gratuit et sans engagement." },
      { title: "2. Plan clair", text: "Une proposition écrite : ce que nous faisons, en combien de temps, et à quel prix." },
      { title: "3. Construction", text: "Nous concevons, développons et connectons tout. Vous validez chaque étape dans votre espace client." },
      { title: "4. Lancement et croissance", text: "Mise en ligne, suivi des résultats et améliorations chaque mois." },
    ],
    workTitle: "Nos réalisations en France",
    workIntro: "Quelques projets parmi nos clients. Les résultats sont ceux enregistrés pour chaque client.",
    work: [{ project: "Boutique Hotel Paris", label: "Hôtellerie · Paris" }],
    viewProject: "Voir le projet (en anglais)",
    testimonialNote: "Témoignage d'une cliente à Toulon (texte original en anglais)",
    testimonialName: "Marie Dupont",
    pricingTitle: "Des prix publiés",
    pricingIntro: "Forfaits mensuels sans engagement. Le budget publicitaire est facturé séparément.",
    perMonth: "/ mois",
    plansFrom: "à partir de",
    tierAudience: {
      Starter: "Pour les entreprises qui démarrent",
      Growth: "Pour les entreprises en croissance",
      Pro: "Pour passer à la vitesse supérieure",
      Enterprise: "Entreprises établies et agences",
    },
    customLabel: "Sur devis",
    seePricing: "Voir le détail des forfaits (en anglais)",
    toolsTitle: "Outils gratuits",
    tools: [
      { to: "/website-audit", name: "Audit de site gratuit", text: "Vitesse, SEO, mobile et confiance : une note sur 100 et les 5 corrections prioritaires." },
      { to: "/ai-receptionist", name: "Démo de réceptionniste IA", text: "Discutez avec un assistant IA qui répond et prend des rendez-vous." },
      { to: "/proposal", name: "Proposition instantanée", text: "Décrivez vos objectifs et recevez une proposition écrite avec le bon forfait." },
    ],
    faqTitle: "Questions fréquentes",
    faqs: [
      { q: "Travaillez-vous avec des entreprises à Toulon ?", a: "Oui. Nous travaillons avec des entreprises à Toulon, dans le Var et partout en France, principalement à distance par visio, WhatsApp et e-mail." },
      { q: "Pouvez-vous travailler en français ?", a: "Nos sites et automatisations peuvent être entièrement en français, et nos assistants IA répondent à vos clients en français. Nos échanges de projet se font principalement en anglais ; parlez-nous de vos besoins linguistiques lors de l'appel." },
      { q: "Combien cela coûte-t-il ?", a: "Nos forfaits mensuels commencent à 99 $ par mois (Starter), puis 299 $ (Growth) et 799 $ (Pro). Les besoins sur mesure font l'objet d'un devis. Le budget publicitaire est en plus." },
      { q: "Y a-t-il un engagement ?", a: "Non, les forfaits sont mensuels et sans engagement." },
      { q: "Combien de temps faut-il pour lancer un site ?", a: "Cela dépend du projet. Vous recevez un calendrier précis dans votre proposition avant de commencer." },
    ],
    finalTitle: "Parlons de votre croissance",
    finalText: "Un appel gratuit de 30 minutes pour identifier vos meilleures opportunités. Aucune obligation.",
    breadcrumb: "Français",
  },
  de: {
    code: "de",
    ogLocale: "de_DE",
    seoTitle: "EmmaForYou — Webdesign, KI-Automatisierung & Marketing (Halle)",
    description: "Websites, KI-Automatisierung für WhatsApp, Onlineshops, Werbung und E-Mail-Marketing für Unternehmen in Halle (Saale) und ganz Deutschland.",
    eyebrow: "Halle (Saale) · Deutschland",
    h1: "Mehr Kunden mit einer Website, die verkauft, und KI, die für Sie antwortet",
    intro: "EmmaForYou entwickelt Websites, Onlineshops und KI-Automatisierungen (WhatsApp-Antworten, Terminbuchung, Erinnerungen) für Unternehmen in Halle, Sachsen-Anhalt und ganz Deutschland. Ein Team, das für das ganze System verantwortlich ist – vom ersten Klick bis zum Kauf.",
    ctaBook: "Kostenloses Gespräch buchen",
    ctaWhatsApp: "Per WhatsApp schreiben",
    trust: ["Monatlich kündbar", "Veröffentlichte Preise, keine Überraschungen", "Kostenloses 30-minütiges Strategiegespräch"],
    servicesTitle: "Was wir für Sie tun",
    servicesIntro: "Wählen Sie einen Service oder kombinieren Sie mehrere. Wir beginnen immer mit dem, was Ihnen am schnellsten Kunden bringt.",
    services: [
      { slug: "ai-automation", name: "KI-Automatisierung & WhatsApp", text: "Ein KI-Assistent beantwortet Kundenanfragen rund um die Uhr auf WhatsApp, Instagram und Ihrer Website, bucht Termine und verschickt Erinnerungen." },
      { slug: "website-design", name: "Websites & Landingpages", text: "Schnelle, mobile Websites mit klarer Botschaft, die Besucher in Anfragen, Anrufe und Buchungen verwandeln." },
      { slug: "ecommerce", name: "E-Commerce", text: "Shopify- oder WooCommerce-Shops, Zahlungen, Warenkorb-Erinnerungen und E-Mails nach dem Kauf." },
      { slug: "ad-marketing", name: "Google- & Meta-Werbung", text: "Kampagnen auf Google, Facebook und Instagram, gemessen an echten Ergebnissen: Anrufe, Nachrichten, Buchungen und Verkäufe." },
      { slug: "email-marketing", name: "E-Mail-Marketing", text: "Willkommensserien, Erinnerungen und Newsletter, die Kunden binden – ohne täglichen Aufwand." },
      { slug: "social-media", name: "Social Media", text: "Regelmäßige, automatisierte Inhalte, damit Sie dort sichtbar bleiben, wo Ihre Kunden sind." },
    ],
    englishNote: "Die Detailseiten sind auf Englisch.",
    processTitle: "So arbeiten wir",
    process: [
      { title: "1. Strategiegespräch", text: "30 Minuten, um Ihr Geschäft, Ihre Kunden und Ihre Ziele zu verstehen. Kostenlos und unverbindlich." },
      { title: "2. Klarer Plan", text: "Ein schriftliches Angebot: was wir tun, wie lange es dauert und was es kostet." },
      { title: "3. Umsetzung", text: "Wir gestalten, entwickeln und verbinden alles. Sie geben jeden Schritt im Kundenportal frei." },
      { title: "4. Start & Wachstum", text: "Livegang, Erfolgsmessung und monatliche Verbesserungen." },
    ],
    workTitle: "Unsere Projekte in Halle",
    workIntro: "Einige Projekte unserer Kunden. Die Ergebnisse sind die für jeden Kunden erfassten Werte.",
    work: [
      { project: "Spice Restaurant", label: "Gastronomie · Halle" },
      { project: "Wellness Clinic Halle", label: "Gesundheit · Halle" },
      { project: "Autohaus Halle", label: "Autohandel · Halle" },
    ],
    viewProject: "Projekt ansehen (auf Englisch)",
    testimonialNote: "Kundenstimme aus Halle (Originaltext auf Englisch)",
    testimonialName: "Klaus Weber",
    pricingTitle: "Veröffentlichte Preise",
    pricingIntro: "Monatlich kündbare Pakete. Werbebudget wird separat abgerechnet.",
    perMonth: "/ Monat",
    plansFrom: "ab",
    tierAudience: {
      Starter: "Für Unternehmen am Anfang",
      Growth: "Für wachsende Unternehmen",
      Pro: "Für Unternehmen, die skalieren wollen",
      Enterprise: "Etablierte Unternehmen & Agenturen",
    },
    customLabel: "Auf Anfrage",
    seePricing: "Alle Paketdetails ansehen (auf Englisch)",
    toolsTitle: "Kostenlose Tools",
    tools: [
      { to: "/website-audit", name: "Kostenloser Website-Check", text: "Geschwindigkeit, SEO, Mobil und Vertrauen: eine Punktzahl von 100 und die 5 wichtigsten Verbesserungen." },
      { to: "/ai-receptionist", name: "KI-Rezeption Demo", text: "Chatten Sie mit einem KI-Assistenten, der Fragen beantwortet und Termine bucht." },
      { to: "/proposal", name: "Sofort-Angebot", text: "Beschreiben Sie Ihre Ziele und erhalten Sie ein schriftliches Angebot mit dem passenden Paket." },
    ],
    faqTitle: "Häufige Fragen",
    faqs: [
      { q: "Arbeiten Sie mit Unternehmen in Halle?", a: "Ja. Wir haben Projekte für Unternehmen in Halle umgesetzt und arbeiten mit Kunden in ganz Deutschland, hauptsächlich per Videocall, WhatsApp und E-Mail." },
      { q: "Können Websites und Chatbots auf Deutsch sein?", a: "Ja. Websites, E-Mails und KI-Assistenten können vollständig auf Deutsch sein. Die Projektkommunikation läuft hauptsächlich auf Englisch; sprechen Sie Ihre Sprachwünsche gern im Gespräch an." },
      { q: "Was kostet das?", a: "Unsere Monatspakete beginnen bei 99 $ pro Monat (Starter), dann 299 $ (Growth) und 799 $ (Pro). Individuelle Anforderungen erhalten ein eigenes Angebot. Werbebudget kommt hinzu." },
      { q: "Gibt es eine Mindestlaufzeit?", a: "Nein, die Pakete sind monatlich kündbar." },
      { q: "Ist das DSGVO-konform möglich?", a: "Wir richten Websites und Automatisierungen mit Datenschutz im Blick ein (z. B. Einwilligungen, Datenminimierung). Die rechtliche Prüfung Ihrer Datenschutzerklärung sollte durch eine Fachperson erfolgen." },
    ],
    finalTitle: "Sprechen wir über Ihr Wachstum",
    finalText: "Ein kostenloses 30-minütiges Gespräch, um Ihre besten Chancen zu finden. Unverbindlich.",
    breadcrumb: "Deutsch",
  },
};
