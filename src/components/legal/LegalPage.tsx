import Navbar from "../Navbar";
import Footer from "../Footer";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="legal mt-10">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
