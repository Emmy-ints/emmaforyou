import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import PublishingEnquiry from "@/components/publishing/PublishingEnquiry";
import { pageHead, breadcrumbLd } from "@/lib/seo";

export const Route = createFileRoute("/publishing/enquiry")({
  validateSearch: (s: Record<string, unknown>) => ({ service: typeof s.service === "string" && /^[a-z0-9-]{2,60}$/.test(s.service) ? s.service : undefined }),
  component: Page,
  head: () => pageHead({
    title: "Book Publishing Enquiry: Formatting, Covers, Launch & Marketing | EmmaForYou",
    description: "Tell us about your book: formatting and conversion, cover design, mockups, listing copy, launch strategy or book marketing. Free, no obligation, reply within one working day.",
    path: "/publishing/enquiry",
    jsonLd: [breadcrumbLd([{ name: "Home", path: "/" }, { name: "Publishing", path: "/publishing" }, { name: "Enquiry", path: "/publishing/enquiry" }])],
  }),
});

function Page() {
  const { service } = Route.useSearch();
  return (
    <ToolShell eyebrow="Publishing support" title="Discuss your book project" intro="A few details about your book help us reply with a useful plan and a fixed quote — not a generic pitch. You keep your rights and royalties; we never promise sales or rankings." width="max-w-3xl">
      <PublishingEnquiry service={service} />
    </ToolShell>
  );
}
