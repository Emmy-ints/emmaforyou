# Architecture rules

- Render the homepage 3D experience with a lazily imported React Three Fiber scene behind ClientOnly; this preserves homepage SSR while isolating WebGL.
- Use the TanStack streaming server route for prototype generation with server-only AI helpers; raw streaming cannot cross the server-function DTO boundary.
- Preview generated documents in opaque-origin sandboxed iframes with a restrictive CSP; untrusted prototype scripts must not access the host or network.
- Keep prototype AI access-denial/credit-pause state in a private service-only table; terminal failures must remain paused across worker restarts.
- Pass prototype intake context through an explicit form prop; preserve existing intake fields and submission flow.