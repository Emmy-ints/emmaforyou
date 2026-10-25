import SectionHead from "./future/SectionHead";

/* Countries named in the story below; positions are a stylised map, not to scale. */
const ROUTES = [
  { name: "United States", x: 70, y: 52 }, { name: "Colombia", x: 92, y: 98 },
  { name: "Spain", x: 168, y: 50 }, { name: "France", x: 178, y: 36 }, { name: "Germany", x: 196, y: 28 },
];
const LAGOS = { x: 186, y: 96 };

/**
 * Founder story: the portrait opens through a widening mask and drifts inside its frame as you
 * scroll; a glass nameplate floats over it. Beside the story, flight paths draw out from Lagos to
 * the countries the story names — "from Lagos to the world".
 */
export default function AboutTeaser() {
  return (
    <section className="ab section-padding" aria-labelledby="ab-h">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <div className="ab-portrait" data-scroll data-tilt="4">
            <img src="/images/emmanuel.webp" width={900} height={1350} decoding="async" loading="lazy"
              alt="Emmanuel Akinloye Oluwaseun — Founder & CEO, EmmaForYou" className="ab-img" />
            <div className="ab-shade" aria-hidden="true" />
            <div className="ab-plate lg">
              <p className="font-display text-lg font-semibold text-white">Emmanuel Akinloye Oluwaseun</p>
              <p className="text-sm text-white/70">Founder & CEO, EmmaForYou</p>
            </div>
          </div>
        </div>

        <div>
          <SectionHead id="ab-h" kicker="Our story" title="From a Laptop in Nigeria to 3 Continents" shine={["3", "Continents"]} />
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            EmmaForYou started as one person's dream in Nigeria, Emmanuel Akinloye Oluwaseun, with a laptop, a vision, and an unshakeable belief that African businesses deserve world-class digital tools.
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Today, we serve clients across Nigeria, Columbia, United States, Germany, France and Spain. From freelancer to agency, this is just the beginning.
          </p>
          <figure className="ab-map mt-6" data-scroll aria-label="Flight paths from Lagos to the United States, Colombia, Spain, France and Germany">
            <svg viewBox="0 0 260 130" aria-hidden="true">
              {ROUTES.map((r, i) => {
                const mx = (LAGOS.x + r.x) / 2, my = Math.min(LAGOS.y, r.y) - 26;
                return <path key={r.name} className="ab-route" pathLength={1} d={`M${LAGOS.x} ${LAGOS.y} Q${mx} ${my} ${r.x} ${r.y}`} style={{ ["--i" as string]: i }} />;
              })}
              {ROUTES.map((r, i) => <circle key={r.name} className="ab-city" cx={r.x} cy={r.y} r="2.6" style={{ ["--i" as string]: i }} />)}
              <circle className="ab-lagos-ring" cx={LAGOS.x} cy={LAGOS.y} r="9" />
              <circle className="ab-lagos" cx={LAGOS.x} cy={LAGOS.y} r="4" />
              <text x={LAGOS.x + 10} y={LAGOS.y + 4} className="ab-label">Lagos</text>
            </svg>
            <figcaption className="text-xs text-muted-foreground">Helping businesses grow — from Lagos to the world.</figcaption>
          </figure>
          <a href="/about" className="btn-primary-gradient mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium">
            Our Full Story →
          </a>
        </div>
      </div>
    </section>
  );
}
