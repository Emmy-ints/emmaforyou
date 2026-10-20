import { createFileRoute, Outlet } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CommunityShell from "../components/community/CommunityShell";

/** Layout for every /community page: the site header, the three-column community shell, the footer. */
export const Route = createFileRoute("/community")({
  component: CommunityLayout,
});

function CommunityLayout() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <CommunityShell><Outlet /></CommunityShell>
      </main>
      <div className="pb-16 md:pb-0"><Footer /></div>
    </>
  );
}
