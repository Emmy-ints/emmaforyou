import { useState, useEffect } from "react";

export default function PageLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const letters = "EmmaForYou".split("");

  useEffect(() => {
    // Returning visitors and reduced-motion users skip the intro animation.
    let seen = false;
    try {
      seen = sessionStorage.getItem("efy_intro_seen") === "1";
      sessionStorage.setItem("efy_intro_seen", "1");
    } catch {
      /* storage blocked */
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onComplete();
      return;
    }
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setFadeOut(true);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 7;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div className="flex items-baseline gap-0.5">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="font-display text-4xl font-extrabold md:text-6xl"
            style={{
              opacity: progress > i * 10 ? 1 : 0,
              transform: progress > i * 10 ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.3s ease ${i * 0.05}s`,
              color: "var(--foreground)",
            }}
          >
            {letter}
          </span>
        ))}
        <span
          className="ml-0.5 inline-block h-2.5 w-2.5 rounded-full md:h-3 md:w-3"
          style={{
            background: "var(--gradient-gold)",
            opacity: progress > 90 ? 1 : 0,
            transform: progress > 90 ? "scale(1)" : "scale(0)",
            transition: "all 0.4s ease",
          }}
        />
      </div>
      <div className="mt-6 h-0.5 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${progress}%`,
            background: "var(--gradient-brand)",
          }}
        />
      </div>
    </div>
  );
}
