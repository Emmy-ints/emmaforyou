import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "fr" | "es" | "de";

export const LANGUAGES: Record<Lang, { label: string; name: string; flag: string }> = {
  en: { label: "EN", name: "English", flag: "🇬🇧" },
  fr: { label: "FR", name: "Français", flag: "🇫🇷" },
  es: { label: "ES", name: "Español", flag: "🇪🇸" },
  de: { label: "DE", name: "Deutsch", flag: "🇩🇪" },
};

type Dict = Record<string, string>;

const TRANSLATIONS: Record<Lang, Dict> = {
  en: {
    nav_home: "Home",
    nav_about: "About",
    nav_services: "Services",
    nav_testimonials: "Testimonials",
    nav_cases: "Case Studies",
    nav_analyser: "Business Analyser",
    cta_waitlist: "Join Waitlist",
    cta_start: "Start Growing My Business",
    cta_watch: "Watch How It Works",
    hero_badge: "🌍 Trusted by businesses across 3 continents",
    hero_title_1: "Your Business Deserves",
    hero_title_2: "To Be Found, Followed",
    hero_title_3: "& ",
    hero_title_4: "Fully Automated",
    hero_sub: "We help fashion stores, clinics, restaurants, coaches, real estate agents and 50+ business types across Nigeria, USA, Europe and Africa grow faster with AI automation, stunning websites, and digital marketing that actually works.",
    analyser_title: "Free Business Analyser",
    analyser_sub: "Answer a few quick questions and get a personalised growth roadmap.",
    analyser_teaser_title: "Get Your Free Business Health Score",
    analyser_teaser_sub: "4 quick questions. Instant insights. Zero spam.",
    analyser_get_full: "Get the Full 10-Step Deep Analysis →",
    waitlist_title: "Be First. Get Early Access. Grow Faster.",
    next: "Next",
    back: "Back",
    get_results: "Get My Results",
    score_label: "Your Business Health Score",
  },
  fr: {
    nav_home: "Accueil",
    nav_about: "À propos",
    nav_services: "Services",
    nav_testimonials: "Témoignages",
    nav_cases: "Études de cas",
    nav_analyser: "Analyseur",
    cta_waitlist: "Rejoindre la liste",
    cta_start: "Faire croître mon entreprise",
    cta_watch: "Voir comment ça marche",
    hero_badge: "🌍 Choisi par des entreprises sur 3 continents",
    hero_title_1: "Votre entreprise mérite",
    hero_title_2: "d'être trouvée, suivie",
    hero_title_3: "et ",
    hero_title_4: "entièrement automatisée",
    hero_sub: "Nous aidons boutiques de mode, cliniques, restaurants, coachs, agents immobiliers et plus de 50 types d'entreprises au Nigeria, USA, Europe et Afrique à croître plus vite avec l'IA, des sites web superbes et un marketing digital qui fonctionne.",
    analyser_title: "Analyseur d'entreprise gratuit",
    analyser_sub: "Répondez à quelques questions et obtenez une feuille de route personnalisée.",
    analyser_teaser_title: "Obtenez votre score gratuit",
    analyser_teaser_sub: "4 questions rapides. Insights instantanés. Zéro spam.",
    analyser_get_full: "Obtenir l'analyse complète en 10 étapes →",
    waitlist_title: "Soyez parmi les premiers. Croissez plus vite.",
    next: "Suivant",
    back: "Retour",
    get_results: "Voir mes résultats",
    score_label: "Score de santé digitale",
  },
  es: {
    nav_home: "Inicio",
    nav_about: "Nosotros",
    nav_services: "Servicios",
    nav_testimonials: "Testimonios",
    nav_cases: "Casos",
    nav_analyser: "Analizador",
    cta_waitlist: "Únete a la lista",
    cta_start: "Hacer crecer mi negocio",
    cta_watch: "Ver cómo funciona",
    hero_badge: "🌍 Elegido por empresas en 3 continentes",
    hero_title_1: "Tu negocio merece",
    hero_title_2: "ser encontrado, seguido",
    hero_title_3: "y ",
    hero_title_4: "totalmente automatizado",
    hero_sub: "Ayudamos a tiendas de moda, clínicas, restaurantes, coaches, agentes inmobiliarios y más de 50 tipos de negocios en Nigeria, USA, Europa y África a crecer más rápido con IA, sitios web increíbles y marketing digital que funciona.",
    analyser_title: "Analizador de negocios gratis",
    analyser_sub: "Responde unas preguntas y obtén una hoja de ruta personalizada.",
    analyser_teaser_title: "Obtén tu puntaje de salud digital",
    analyser_teaser_sub: "4 preguntas rápidas. Insights instantáneos. Cero spam.",
    analyser_get_full: "Obtener el análisis completo de 10 pasos →",
    waitlist_title: "Sé el primero. Crece más rápido.",
    next: "Siguiente",
    back: "Atrás",
    get_results: "Ver mis resultados",
    score_label: "Puntaje de salud digital",
  },
  de: {
    nav_home: "Start",
    nav_about: "Über uns",
    nav_services: "Leistungen",
    nav_testimonials: "Stimmen",
    nav_cases: "Fallstudien",
    nav_analyser: "Analyser",
    cta_waitlist: "Warteliste",
    cta_start: "Mein Geschäft wachsen lassen",
    cta_watch: "So funktioniert's",
    hero_badge: "🌍 Vertraut von Unternehmen auf 3 Kontinenten",
    hero_title_1: "Ihr Unternehmen verdient",
    hero_title_2: "gefunden, verfolgt",
    hero_title_3: "und ",
    hero_title_4: "voll automatisiert zu sein",
    hero_sub: "Wir helfen Modehäusern, Kliniken, Restaurants, Coaches, Immobilienmaklern und über 50 Branchen in Nigeria, USA, Europa und Afrika, schneller zu wachsen mit KI, hervorragenden Websites und digitalem Marketing, das wirklich funktioniert.",
    analyser_title: "Kostenloser Business-Analyser",
    analyser_sub: "Beantworten Sie ein paar Fragen und erhalten Sie eine personalisierte Wachstums-Roadmap.",
    analyser_teaser_title: "Ihr kostenloser Digital-Health-Score",
    analyser_teaser_sub: "4 schnelle Fragen. Sofortige Insights. Kein Spam.",
    analyser_get_full: "Vollständige 10-Schritt-Analyse anfordern →",
    waitlist_title: "Seien Sie der Erste. Wachsen Sie schneller.",
    next: "Weiter",
    back: "Zurück",
    get_results: "Ergebnisse anzeigen",
    score_label: "Digital-Health-Score",
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

const STORAGE_KEY = "emma_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in LANGUAGES) setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
