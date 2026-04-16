const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function AboutTeaser() {
  return (
    <section className="section-padding bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <div className="relative h-80 w-80 overflow-hidden rounded-3xl md:h-96 md:w-96">
            <img
              src="/images/emmanuel.png"
              alt="Emmanuel Akinloye Oluwaseun — Founder & CEO, EmmaForYou"
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top, var(--emma-charcoal) 0%, transparent 50%)" }} />
            <div className="absolute bottom-4 left-4 right-4 text-left">
              <p className="font-display text-lg font-bold text-white">Emmanuel Akinloye Oluwaseun</p>
              <p className="font-body text-sm font-normal text-white/60">Founder & CEO, EmmaForYou</p>
            </div>
          </div>
        </div>

        <div>
          <span className="inline-block rounded-full bg-muted px-4 py-1.5 font-body text-xs font-medium text-muted-foreground">
            Our Story
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            From a Laptop in Nigeria to{" "}
            <span className="gradient-text">3 Continents</span>
          </h2>
          <p className="mt-5 font-body text-base font-normal leading-relaxed text-muted-foreground">
            EmmaForYou started as one person's dream in Nigeria — Emmanuel Akinloye Oluwaseun — with a laptop, a vision, and an unshakeable belief that African businesses deserve world-class digital tools.
          </p>
          <p className="mt-3 font-body text-base font-normal leading-relaxed text-muted-foreground">
            Today, we serve clients across Lagos, Hanover, Toulon, Halle, and Cookhouse. From freelancer to agency — this is just the beginning.
          </p>
          <a
            href="/about"
            className="btn-primary-gradient mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-body text-sm font-medium"
          >
            Our Full Story →
          </a>
        </div>
      </div>
    </section>
  );
}
