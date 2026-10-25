import StatusScreen from "./components/future/StatusScreen";
import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <StatusScreen
      code="Error"
      title="Something went wrong."
      body="An unexpected error stopped this page from loading. Please try again; if it keeps happening, message us on WhatsApp."
      detail={import.meta.env.DEV && error.message ? <pre className="mx-auto mt-4 max-h-40 max-w-lg overflow-auto rounded-xl bg-black/40 p-3 text-left font-mono text-xs text-red-300">{error.message}</pre> : null}
      actions={<>
        <button type="button" onClick={() => { router.invalidate(); reset(); }} className="btn-primary-gradient inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium">Try again</button>
        <a href="/" className="hero-ghost-btn">Go home</a>
      </>}
    />
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
    // Cross-fade between pages where the browser supports view transitions (reduced motion turns it off in CSS).
    defaultViewTransition: true,
  });

  return router;
};
