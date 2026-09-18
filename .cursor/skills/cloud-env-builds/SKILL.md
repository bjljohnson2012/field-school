---
name: cloud-env-builds
description: Keep Field School Cloud Agent environment builds, lockfiles, and install scripts healthy. Use for environment.json, npm ci, or migrate-to-builds — not app feature work.
---
# Cloud env builds

Load `env-setup` and `migrate-to-builds`.

## Own

- Reproducible `npm ci` / lockfiles for `app/` and the repo root
- Cloud Agent install/start so campus tests can run
- Environment builds via cursor-cloud (`list-environment-builds`, `trigger-environment-build`) when asked

## Do not

- Put secrets in `environment.json`
- Change campus product behavior, AUTH_URL, or Caddy
- Touch CNC vault
- Propose an environment until a draft build has succeeded

Prefer Dockerfile for slow system deps and idempotent `install` for repo deps.
