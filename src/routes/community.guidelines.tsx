import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/community/guidelines")({
  head: () => pageHead({
    title: "Community Guidelines — EmmaForYou Community",
    description: "How we keep the EmmaForYou Community helpful, respectful and safe: what to post, what isn't allowed, and how reporting and moderation work.",
    path: "/community/guidelines",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Community", path: "/community" }, { name: "Guidelines", path: "/community/guidelines" }])],
  }),
  component: Guidelines,
});

const SECTIONS: { h: string; items: string[] }[] = [
  { h: "Be helpful", items: [
    "Ask clear questions: say what you're trying to do, what you tried and what happened.",
    "When someone answers your question, mark the answer that solved it as accepted so others can find it.",
    "Share what you learn: tutorials, project write-ups and honest lessons are the most valuable posts here.",
  ] },
  { h: "Be respectful", items: [
    "Disagree with ideas, not people. No insults, harassment, threats or pile-ons.",
    "No hate speech or discrimination of any kind.",
    "Respect privacy: don't post anyone's personal details, private messages or screenshots without consent.",
  ] },
  { h: "Keep it genuine", items: [
    "No spam, repeated posts, link farming or undisclosed advertising. You may share your own work when it's relevant and you say it's yours.",
    "Don't impersonate people or companies, and don't post fake reviews or misleading claims.",
    "No malware, scams, pirated software or anything illegal.",
  ] },
  { h: "Safety and reporting", items: [
    "Use Report on any post, comment or profile that breaks these guidelines. Reporters stay anonymous to the member reported.",
    "You can block anyone. Blocked members can't see your posts or comments, and you won't see theirs.",
    "Our moderators review reports, and may remove content or suspend accounts. Every moderation action is recorded.",
  ] },
];

function Guidelines() {
  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-5 sm:p-8">
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Community guidelines</h1>
      <p className="mt-2 text-sm text-muted-foreground">The EmmaForYou Community is a place for business owners, builders and learners to help each other with websites, apps, AI and automation. These rules keep it useful for everyone.</p>
      {SECTIONS.map((s) => (
        <section key={s.h} className="mt-6">
          <h2 className="font-display text-lg font-bold">{s.h}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
        </section>
      ))}
      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Specialist badges</h2>
        <p className="mt-2 text-sm text-muted-foreground">A badge next to a name means the member is a verified EmmaForYou specialist, assigned only by our administrators. We never sell or invent badges.</p>
      </section>
      <p className="mt-6 text-sm text-muted-foreground">Questions about these guidelines? <Link to="/contact" className="font-semibold text-foreground underline">Contact us</Link>. See also our <Link to="/privacy" className="font-semibold text-foreground underline">privacy policy</Link> and <Link to="/terms" className="font-semibold text-foreground underline">terms</Link>.</p>
    </article>
  );
}
