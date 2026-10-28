import { createFileRoute } from "@tanstack/react-router";
import ToolShell from "@/components/tools/ToolShell";
import AuthorWorkspace from "@/components/publishing/AuthorWorkspace";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/account_/books")({
  component: Page,
  head: () => pageHead({ title: "Author workspace | EmmaForYou", description: "Your private book projects: eBooks, covers, mockups, listing copy, launch plans and readiness checks.", path: "/account/books", noindex: true }),
});

function Page() {
  return (
    <ToolShell eyebrow="Your account" title="Author workspace" intro="Your saved book projects, private to your account. Open one to keep working, update its status, or delete it." width="max-w-5xl">
      <AuthorWorkspace />
    </ToolShell>
  );
}
