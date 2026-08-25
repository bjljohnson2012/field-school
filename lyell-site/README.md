# LyellX

Official site for LyellX LLC, the management and holding company that owns and operates Field School.

Domain: `lyellx.com`

## Pages

- Home
- Companies (Field School, Ben Johnson)
- Community
- Contact

Static HTML. Material 3 Expressive tokens. No build step.

## Local

```bash
python3 -m http.server 4173 --directory lyell-site
```

Open http://127.0.0.1:4173

## Squarespace DNS

`lyellx.com` is registered through Squarespace (Google Domains nameservers). The site files live on Hostinger. Point the domain in Squarespace DNS. Do not switch nameservers unless you also want Hostinger to own email DNS.

1. Squarespace → Domains → `lyellx.com` → DNS.
2. Delete the existing A records on `@` that point at Squarespace (`23.21.157.88` and `23.21.234.173`).
3. Add these custom records:

| Type | Host | Data | TTL |
| --- | --- | --- | --- |
| A | `@` | `145.79.4.8` | 1 hour |
| CNAME | `www` | `lyellx.com` | 1 hour |

4. Do not touch MX or TXT. This domain already uses Google mail (`aspmx.l.google.com` and `v=spf1 include:_spf.google.com`). Changing those breaks email.
5. Save. Wait for DNS. Then `https://lyellx.com` serves this folder.

Preview while DNS is still on Squarespace: `http://lyell.benjohnson.ai`
