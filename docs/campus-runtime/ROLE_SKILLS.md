# Role skills

Canonical git: origin/main. Pin at write: a183f6fcf4ecea6e14507e2ec8f94c00d67770e1.
Skills tree branch: cursor/agent-role-skills-ca6e. Wave 2 work: cursor/wave-2-tenants-ca6e — merge origin/main first.

Only Ship Wave 2 tenants may do new campus build work.

Wave 2 must attach and not replace:
- docs/campus-runtime/fp-50-v1.md
- app/db/0002_field_pattern.sql
- app/db/0003_pattern_weights.sql
- app/db/0004_tenants.sql

See full worker table, git SHAs, and replacement SKILL.md text in this conversation artifact ROLE_SKILLS.md if this file is later expanded. Short mandates:

- wave2-tenants: household+sales picker invites fp-50 from those files. Branch cursor/wave-2-tenants off origin/main.
- stripe-paid-seats: checkout webhooks Resend only.
- madeup-master: existing Everything Is Made Up Remotion master only. No plates/.
- lyell-holding-site: branch cursor/lyell-holding-site-646c only.
- admin-google-auth: dean allowlist. No AUTH_URL flip.
- portal-deploy: app/deploy/deploy.sh. Not TanStack.
- hostinger-vps-access: campus SSH/DNS. Not vault 2.24.64.248.
- campus-walkthroughs: recordings only.
- cloud-env-builds: lockfiles / npm ci.
- guest-grok-bot: unsigned station, no Postgres write, no scrape.
- living-profile-stt: read-only fp-50-v1 + 0002 + 0003. Nudge only. No new items.

Add: factory-lock (Just + melt), freeze-tanstack, hold-later-waves.
Do not add a second Pattern bank worker.
