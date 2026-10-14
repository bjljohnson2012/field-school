# M13 Payload spike (do not merge)

Throwaway operator admin for issue 376. This directory is not the campus app.

- Payload 3.90.2 runs on port 4321. Campus routes are unchanged.
- Database names allowed: `fs_payload_spike`, `fs_payload_b`, `fs_payload_collide`. Local socket peer auth. No password in git.
- Drizzle stays the campus runtime. This spike does not add a file under `app/db/`.
- No `AUTH_URL` change. `CHECKOUT_GO_LIVE` and `COACHING_GO_LIVE` stay false.
- Operator-only. No parent admin. No child login. No edge scope column.
- Do not point `SPIKE_DATABASE_URL` at production.

```bash
bash run-spike.sh
```

Evidence lands in `evidence/`. Secrets stay in `.secrets/` and are gitignored.
