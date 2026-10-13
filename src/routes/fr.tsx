import { createFileRoute } from "@tanstack/react-router";
import LocaleLanding, { localeHead } from "../components/LocaleLanding";

export const Route = createFileRoute("/fr")({
  component: () => <LocaleLanding code="fr" />,
  head: () => localeHead("fr"),
});
