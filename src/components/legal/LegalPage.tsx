import Navbar from "../Navbar";
import Footer from "../Footer";
import { KineticText } from "../future/Kinetic";

/** Legal pages: calm reading layout (subtle motion level) with a glass title plate and comfortable measure. */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <header className="legal-head lg">
          <p className="sx-kicker"><span className="sx-kicker-dot" aria-hidden="true" />Legal</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl"><KineticText text={title} base={40} /></h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
        </header>
        <div className="legal mt-10">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
