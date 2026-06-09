# idktheflag website

The public website for **idktheflag**, a competitive CTF team. Live at [idktheflag.sh](https://idktheflag.sh).

## What it does

- **Homepage** — team intro and stuff
- **About** — full roster with roles, semi-active, retired members, and contact info
- **CTFs** — live CTF history pulled from the CTFtime API, with rating points, placements, and links to writeups
- **Blog** — writeups and posts authored by team members, rendered from markdown
- **Team profiles** — individual pages for each member

## Tech stack

- [Astro](https://astro.build) — static site generator
- Bun — package manager / runtime
- Deployed on Cloudflare Pages

## Running locally

```bash
bun install
bun run dev
```

Builds to `dist/` via `bun run build`.

## Structure

```
src/
  pages/       # routes (index, about, ctfs, blog, team/*)
  content/     # markdown blog posts and team bios
  layouts/     # shared page wrapper
  components/  # reusable UI pieces
  utils/       # CTFtime API fetch + caching
  data/        # team ID, manual CTF overrides
public/        # static assets (logos, profile pictures)
```

## CTFtime integration

`src/utils/ctftime.ts` fetches the team's event history from the CTFtime API at build time and renders it on the CTFs page alongside any manually-specified entries and writeup links.
