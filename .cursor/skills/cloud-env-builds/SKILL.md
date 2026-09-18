---
name: cloud-env-builds
description: Fenced. Cloud Agent environment builds, lockfiles, and npm ci. Not app feature work. Does not block Wave 2.
---

# Cloud env builds

Wave: fenced. Does not block Wave 2.

Attach:

- Cursor skills `env-setup` and `migrate-to-builds`
- `package-lock.json` / `app/package-lock.json` as present
- `.cursor/environment.json` when present

Absorbed branches: none. Related historical branches `cursor/setup-dev-environment-f793` and `cursor/fix-npm-ci-lockfile-sync-a6ec` stay closed.

## Own

- Reproducible `npm ci` / lockfiles for `app/` and the repo root
- Cloud Agent install/start so campus tests can run
- Environment builds via cursor-cloud (`list-environment-builds`, `trigger-environment-build`) when asked

## Do not

- Put secrets in `environment.json`
- Change campus product behavior, `AUTH_URL`, or Caddy
- Touch CNC vault
- Propose an environment until a draft build has succeeded
- Block Wave 2

Prefer Dockerfile for slow system deps and idempotent `install` for repo deps.
