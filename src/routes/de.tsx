import { createFileRoute } from "@tanstack/react-router";
import LocaleLanding, { localeHead } from "../components/LocaleLanding";

export const Route = createFileRoute("/de")({
  component: () => <LocaleLanding code="de" />,
  head: () => localeHead("de"),
});
