const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

export default function MissionSection() {
  return (
    <section className="section-padding" style={{ background: "var(--gradient-dark)" }}>
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-10">
          <span className="gradient-text-gold font-display text-6xl font-extrabold leading-none">"</span>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/50">Our Mission</h3>
          <p className="mt-4 font-display text-xl font-bold leading-relaxed text-white md:text-2xl">
            To help business owners save time, capture more leads, and close more customers through simple, affordable AI automation.
          </p>
        </div>

        <div className="border-t border-white/10 pt-10">
          <span className="gradient-text-gold font-display text-6xl font-extrabold leading-none">"</span>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/50">Our Vision</h3>
          <p className="mt-4 font-display text-xl font-bold leading-relaxed text-white md:text-2xl">
            A future where no business loses a customer because of a slow reply or missed follow-up.
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-12 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm"
        >
          Work With Us →
        </a>
      </div>
    </section>
  );
}
