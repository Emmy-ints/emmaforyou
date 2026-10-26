/** Answer for a method an API route doesn't support (instead of falling through to an empty page). */
export const methodNotAllowed = (allow = "POST") => () =>
  new Response(JSON.stringify({ message: `Use ${allow} for this endpoint.` }), { status: 405, headers: { Allow: allow, "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
