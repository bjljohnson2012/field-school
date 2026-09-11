# Frozen: TanStack campus demo

This repo's `src/` tree (TanStack Start + Vite + Better Auth + PGlite, migrations 0001–0003) is a parked single-campus demo.

It is not the live portal. It is not the campus runtime plan. Do not add features here.

Kept on main only so history is not lost. Official work happens in `docs/campus-runtime/` and `app/`.

Frozen paths:

- `src/` (routes, router, routeTree.gen.ts)
- `vite.config.ts`
- `migrations/0001_auth.sql`
- `migrations/0002_course.sql`
- `migrations/0003_university.sql`
- root `package.json` scripts that call Vite (`npm run dev` on port 8080)

Live guest campus still runs as Next on the VPS. Wave 1 puts that runtime, with Postgres, into `app/` on this repo.
