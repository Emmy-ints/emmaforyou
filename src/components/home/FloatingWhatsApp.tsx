import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";
const DISMISS_KEY = "emma_wa_dismissed_at";

export default function FloatingWhatsApp() {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const check = () => {
      try {
        const last = localStorage.getItem(DISMISS_KEY);
        // Once dismissed, stay quiet for a day instead of nagging every few minutes.
        if (last && Date.now() - parseInt(last) < 24 * 60 * 60 * 1000) return false;
      } catch {
        /* storage blocked: still fine to show once */
      }
      return true;
    };
    if (!check()) return;
    const t = setTimeout(() => setShowBubble(true), 30000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      /* ignore */
    }
    setShowBubble(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[150] hidden flex-col items-end gap-3 sm:bottom-5 sm:right-5 md:flex">
      <AnimatePresence>
        {showBubble && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}
            className="relative max-w-[15rem] rounded-2xl border border-border bg-card p-3.5 pr-9 shadow-2xl sm:max-w-xs sm:p-4 sm:pr-9">
            <button onClick={dismiss} aria-label="Dismiss"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><span aria-hidden="true">✕</span></button>
            <p className="text-[13px] font-semibold text-foreground sm:text-sm">👋 Hi! Need help growing your business?</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-emma-blue">
              Chat with us →
            </a>
          </motion.div>
        )}
      </AnimatePresence>
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
        className="group relative flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14 rounded-full text-white shadow-xl transition-transform hover:scale-110"
        style={{ background: "linear-gradient(135deg, #25d366, #128c7e)" }}>
        <span className="absolute inset-0 -z-10 animate-ping rounded-full opacity-40" style={{ background: "#25d366" }} />
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
      </a>
    </div>
  );
}
