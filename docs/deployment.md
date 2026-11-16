# Deployments: Lovable and Vercel (one codebase)

The same GitHub repository (`Emmy-ints/emmaforyou`, branch `main`) deploys to two hosts. Nothing is
forked or duplicated; every commit goes to both.

| | Lovable | Vercel |
|---|---|---|
| Address | https://emmaforyou.lovable.app | https://emmaforyou-di-sco-sundays-llc.vercel.app (+ your custom domain) |
| How it updates | Lovable syncs `main` automatically; publish from Lovable (or the Lovable deploy tool) | `.github/workflows/vercel-deploy.yml` asks Vercel to build each push to `main` (needs the `VERCEL_TOKEN` repo secret) |
| Build | Lovable's own (bun, Cloudflare target) | Vercel project `emmaforyou` (team DIsco Sundays LLC): framework TanStack Start, install `bun install`, Node 22; Nitro outputs Vercel's format automatically |
| Database, auth, storage | Lovable Cloud (Supabase project `pvbowernbnltvwicukcy`): **shared by both** | same |
| Which host built it | `/api/site-config-status` → `"host": "lovable"` | `"host": "vercel"` (and `commit` = the Git commit) |

## Environment variables on Vercel
Public (set by Claude): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` and the `VITE_` copies
(same values as `.env`).

Secrets (the owner adds them in Vercel → Settings → Environment Variables; never commit them):
- `SUPABASE_SERVICE_ROLE_KEY`: server writes (leads, showcase, admin tools)
- `OPENAI_API_KEY`: every AI feature (Lovable uses the same key)
- optional: `OPENAI_MODEL`, `OPENAI_MODEL_CREATIVE`, `PAGESPEED_API_KEY`, `CALENDLY_TOKEN`

After changing a variable, redeploy (Vercel → Deployments → Redeploy).

## Things that stay on one host on purpose
- Scheduled jobs (agents, blog automation, inspiration library, alerts) are started by the database with
  `pg_net` and call the Lovable address. Running them from both hosts would do every job twice.

## Custom domain
Add it in Vercel → emmaforyou → Settings → Domains; Vercel shows the DNS records and issues HTTPS
automatically. When it is the main address, set `VITE_SITE_URL` (in `.env`, so both hosts agree) so
canonicals, sitemap and structured data point at it, and add it to the auth redirect URLs in Lovable Cloud.

## Security
`@tanstack/react-start` is pinned to 1.168.60 (with `@tanstack/react-router` 1.170.41) to fix
CVE-2026-102989; Vercel refuses to deploy older versions.
