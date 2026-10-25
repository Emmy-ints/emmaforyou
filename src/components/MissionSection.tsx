import { ScrubWords } from "./future/Kinetic";

const WHATSAPP_URL = "https://wa.me/message/HHGMMWMRJFYUC1";

/**
 * Mission and vision as two cinematic statements: each sentence lights up word by word as it
 * scrolls through the screen, over a slow aurora. Fully lit and still with reduced motion.
 */
export default function MissionSection() {
  return (
    <section className="ms band-ink section-padding" aria-label="Our mission and vision">
      <div className="ms-aurora" aria-hidden="true"><span /><span /><span /></div>
      <div className="relative mx-auto max-w-4xl text-center">
        <div className="ms-block">
          <h3 className="ms-label">Our Mission</h3>
          <p className="ms-text">
            <ScrubWords text="To help business owners save time, capture more leads, and close more customers through simple, affordable AI automation." accent={["save", "time", "leads", "customers"]} />
          </p>
        </div>
        <div className="ms-divider" aria-hidden="true" />
        <div className="ms-block">
          <h3 className="ms-label">Our Vision</h3>
          <p className="ms-text">
            <ScrubWords text="A future where no business loses a customer because of a slow reply or missed follow-up." accent={["no", "business"]} />
          </p>
        </div>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-gold mt-12 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm">
          Work With Us →
        </a>
      </div>
    </section>
  );
}
