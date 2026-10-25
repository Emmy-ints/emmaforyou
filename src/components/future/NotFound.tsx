import { Link } from "@tanstack/react-router";
import StatusScreen from "./StatusScreen";

/** Site-wide 404. */
export default function NotFoundComponent() {
  return (
    <StatusScreen
      code="404"
      title="This page drifted out of orbit."
      body="The page you're looking for doesn't exist or has moved. Search the site, or head somewhere useful."
      actions={<>
        <Link to="/" className="btn-primary-gradient inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium">Go home</Link>
        <button type="button" onClick={() => window.dispatchEvent(new Event("efy-open-search"))} className="hero-ghost-btn">Search the site</button>
        <Link to="/services" className="hero-ghost-btn">Our services</Link>
      </>}
    />
  );
}
