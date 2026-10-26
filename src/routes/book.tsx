import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import FounderCard from "../components/future/FounderCard";
import SolutionFinder from "../components/future/SolutionFinder";
import CalendlyBooking from "../components/tools/CalendlyBooking";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "What happens on the strategy call?", a: "A 30-minute video or WhatsApp call with Emmanuel. We look at how customers find you, contact you and buy from you today, and outline the two or three changes likely to make the biggest difference. You keep the plan even if you don't work with us." },
  { q: "How do I join the call?", a: "After you book, you get a confirmation email with the call details and an option to add it to your calendar, plus a reminder before the call." },
  { q: "Can I reschedule?", a: "Yes. Use the reschedule or cancel link in your confirmation email, or message us on WhatsApp." },
];

export const Route = createFileRoute("/book")({
  component: Page,
  head: () =>
    pageHead({
      title: "Book a Free Strategy Call with EmmaForYou",
      description: "Pick a time for a free 30-minute strategy call with founder Emmanuel Oluwaseun Akinloye. Times shown in your timezone, with email confirmation and reminders.",
      path: "/book",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Book a call", path: "/book" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free · 30 minutes"
      title="Book your free strategy call"
      intro="Choose a time that works for you. Times are shown in your own timezone, and you'll get a confirmation email with the call details."
      answers={ANSWERS}
      width="max-w-5xl"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <CalendlyBooking />
        <aside className="lg-strong rounded-[26px] p-5">
          <FounderCard line="You'll speak with me directly. I'll look at your business before the call and come with ideas, not a sales script." />
          <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <li>✓ 30 minutes, free, no obligation</li><li>✓ WhatsApp or Zoom</li><li>✓ A clear next step either way</li>
          </ul>
        </aside>
      </div>
      <div className="mt-14"><SolutionFinder id="book-finder" compact /></div>
    </ToolShell>
  );
}
