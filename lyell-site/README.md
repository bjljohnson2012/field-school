# Lyell

Public site for Lyell, the holding company over Field School.

Legal name: LyellX LLC. On the site we call it Lyell. Intended domain: `lilux.com`.

## Pages

- Home
- Companies (Field School, Ben Johnson)
- Vision
- Contact

Static HTML. Material 3 Expressive tokens, Roboto Flex, no build step.

## Local

```bash
python3 -m http.server 4173 --directory lyell-site
```

Open http://127.0.0.1:4173

## Point lilux.com from Squarespace

The files here are the site. Squarespace is the registrar, not the page builder.

1. Host this folder on Hostinger (or any static host).
2. In Squarespace Domains, open `lilux.com` → DNS.
3. Add an A record for `@` to the host IP, and a CNAME for `www` to the host, or switch nameservers to the host.
4. Wait for DNS. Then `https://lilux.com` serves these files.

`lilux.com` currently parks on Sedo. If Squarespace does not list the domain, the registrar is not connected yet. `lyellx.com` is the 2022 placeholder. This site can serve either name.

## Preview

A Hostinger preview can live at `lyell.benjohnson.ai` once that subdomain is created and this folder is deployed to it.
