import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import BookingCalendar from "../components/tools/BookingCalendar";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "What happens on the strategy call?", a: "A 30-minute video or WhatsApp call with Emmanuel. We look at how customers find you, contact you and buy from you today, and outline the two or three changes likely to make the biggest difference. You keep the plan even if you don't work with us." },
  { q: "How do I join the call?", a: "After you book, Emmanuel sends the call link to your WhatsApp. Add the booking to your calendar from the confirmation screen so you get a reminder." },
  { q: "Can I reschedule?", a: "Yes. Message us on WhatsApp and we'll move it to a time that suits you." },
];

export const Route = createFileRoute("/book")({
  component: Page,
  head: () =>
    pageHead({
      title: "Book a Free Strategy Call with EmmaForYou",
      description: "Pick a time for a free 30-minute strategy call with founder Emmanuel Akinloye Oluwaseun. Times shown in your timezone; the call link arrives on WhatsApp.",
      path: "/book",
      jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Book a call", path: "/book" }])],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Free · 30 minutes"
      title="Book your free strategy call"
      intro="Choose a time that works for you. Times are shown in your own timezone, and you'll get the call link on WhatsApp."
      answers={ANSWERS}
      width="max-w-5xl"
    >
      <BookingCalendar />
    </ToolShell>
  );
}
