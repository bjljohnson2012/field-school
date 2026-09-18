---
name: Lockfiles + Cloud Agent
description: Lockfiles + Cloud Agent — npm ci / lockfiles only (absorb New development environment)
---

# Lockfiles + Cloud Agent

Wave: infra / fenced. Does not block Wave 2.

Attach:

- Cursor skills `env-setup` and `migrate-to-builds`
- `package-lock.json` / `app/package-lock.json` as present
- `.cursor/environment.json` when present

Absorbed branches (stop using separately):

- `cursor/setup-dev-environment-f793` (New development environment)
- `cursor/fix-npm-ci-lockfile-sync-a6ec`

## Own

- `npm ci` / lockfiles for `app/` and the repo root
- Cloud Agent install/start so campus tests can run
- Environment builds via cursor-cloud when asked

## Do not

- Put secrets in `environment.json`
- Change campus product behavior, `AUTH_URL`, or Caddy
- Touch CNC vault
- Block Wave 2
