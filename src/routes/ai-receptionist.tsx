import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "../components/tools/ToolShell";
import ReceptionistDemo from "../components/tools/ReceptionistDemo";
import { pageHead, breadcrumbLd } from "@/lib/seo";

const ANSWERS = [
  { q: "What is an AI receptionist?", a: "An AI receptionist is an assistant that answers customer messages for your business around the clock: it replies to questions about prices, hours and services, and books appointments or reservations into your calendar. It works on WhatsApp, Instagram, Facebook Messenger and your website chat." },
  { q: "Will it give customers wrong information?", a: "It only answers from the information you approve: your services, prices, hours and policies. When a question isn't covered, it says it will check with your team and passes the conversation to a person." },
  { q: "Can it answer phone calls?", a: "This demo covers chat and voice in the browser. Phone answering is possible with a separate telephony setup; we scope it on a strategy call because it depends on your phone provider and country." },
  { q: "What happens to what I type here?", a: "Your messages are sent to our AI provider only to generate the reply. We don't store the conversation, and voice input is converted to text by your own browser." },
];

export const Route = createFileRoute("/ai-receptionist")({
  component: Page,
  head: () =>
    pageHead({
      title: "AI Receptionist Demo — Chat or Talk to a 24/7 Booking Assistant",
      description: "Try an AI receptionist live: ask a salon, dental clinic or restaurant about prices and hours, book an appointment by text or voice, and see replies in seconds.",
      path: "/ai-receptionist",
      jsonLd: [
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "AI receptionist demo", path: "/ai-receptionist" }]),
      ],
    }),
});

function Page() {
  return (
    <ToolShell
      eyebrow="Live demo · AI automation"
      title="Talk to an AI receptionist"
      intro="Pick a sample business and message it like a customer would, or tap the mic and speak. It answers questions and books appointments in seconds, day or night. This is the assistant we set up for clients."
      answers={ANSWERS}
    >
      <ReceptionistDemo />
    </ToolShell>
  );
}
