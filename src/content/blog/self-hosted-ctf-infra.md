---
title: 'How We Built a Self-Hosted CTF Platform (From Scratch-ish)'
description: 'Custom CTFd deployment with Cloudflare Tunnel, per-player instancing, WebSocket bridge for nc challenges, and a theme that actually looks good.'
pubDate: '2026-03-26'
author: 'riverxia'
---

# Why Self-Host?

We wanted to practice. Not "do random CTFs when they happen" practice — actual, controlled, "here are challenges we wrote for each other" practice. The kind where you can leave challenges up for weeks and people can work at their own pace.

Hosted CTFd is fine but costs money and doesn't let you do fun things like per-player Docker containers. So we self-hosted. On a teammate's home server. In Ohio. Through a Cloudflare Tunnel. Because why make anything easy.

# The Stack

- **CTFd** — the platform itself (open source, Flask-based)
- **Docker Swarm** — orchestrates challenge containers
- **ctfd-whale** — CTFd plugin for per-player container provisioning
- **frp** (v0.48) — routes traffic to dynamically provisioned containers
- **Cloudflare Tunnel** — exposes everything to the internet without opening ports
- **nginx** — reverse proxy, handles subdomain routing
- **Custom theme** — because the default CTFd theme is boring

All orchestrated with Docker Compose. The entire thing starts with one command.

# The Architecture

```
Player's Browser
  → Cloudflare (TLS termination, free wildcard cert)
    → cloudflared tunnel (CLI-managed, wildcard ingress)
      → nginx
        ├── main site          → CTFd
        ├── challenge instances → frps → per-player Docker containers
        └── private registry   → Docker Registry v2
```

Every challenge instance gets a unique subdomain: `<uuid>-ctf.domain.tld`. The wildcard SSL cert covers `*.domain.tld` — so `abc123-ctf.domain.tld` just works. No per-challenge cert provisioning, no port forwarding.

The server operator runs `./setup.sh`. That's it. Docker Swarm init, node labeling, `docker compose up -d`. Done.

# The Theme

CTFd's default theme is functional but looks like every other CTFd instance. We wanted ours to match our team website — dark background, red accents, terminal aesthetic.

CTFd themes are Jinja2 templates + SCSS compiled with Vite. We copied the `core` theme and rewired it:

- **Colors**: Bootstrap variable overrides — `$body-bg: #0d1117`, `$primary: #ff4b4b`, `$card-bg: #161b22`, etc.
- **Fonts**: Replaced Lato/Raleway with Atkinson Hyperlegible (our website's font)
- **Dark mode only**: Gutted the light/dark toggle, forced `data-bs-theme="dark"`
- **Animations**: Cards lift on hover, challenge buttons glow red, jumbotron has a subtle grid overlay, CRT scanlines on the page, blinking terminal cursor on prompts
- **Navbar**: Red bottom border, blur backdrop, link underline slide animation

The theme builds with `npx vite build` and lives in the repo. When you select it in CTFd's admin panel, it just works.

# Per-Player Challenge Instancing

This was the hardest part. CTFd doesn't natively support giving each player their own Docker container. Enter **ctfd-whale** — a community plugin that:

1. Player clicks "Launch" on a challenge
2. ctfd-whale creates a Docker Swarm service for that player
3. A unique flag is injected via `FLAG` environment variable
4. frp registers a subdomain route to the container
5. Player gets a link like `https://uuid-ctf.domain.tld/`
6. Container auto-destroys after a timeout

The gotchas we hit:
- **frp version matters**. ctfd-whale sends INI-format config to frpc's admin API. frp v0.50+ switched to TOML/JSON. We pinned to **v0.48.0**.
- **The `[common]` section**. frpc 0.48's admin API returns config without `[common]`, but the reload endpoint requires it. We had to manually set the config template in CTFd's database.
- **Docker socket permissions**. CTFd runs as a non-root user by default. The Docker socket needs root. We set `user: root` in docker-compose for the CTFd service. It's a home server, not Fort Knox.
- **The Docker python package**. ctfd-whale pins `docker==4.1.0` which doesn't work with `urllib3>=2.0`. Bumped to `docker>=7.0.0`.

# The NC Challenge Problem

Web challenges work great with subdomain routing. But pwn/nc challenges need raw TCP — and Cloudflare Tunnel doesn't proxy arbitrary TCP to the internet.

Options we considered:
1. Port forwarding on the router → server operator has to configure things (bad)
2. Tailscale VPN → everyone installs software (bad)
3. `cloudflared access tcp` on client side → everyone installs a binary (bad)

Our solution: **WebSocket bridge**. Challenge containers run a Python WebSocket server on port 80 that spawns the challenge binary and bridges stdin/stdout over WebSocket. From the outside, it's HTTP — goes through the tunnel like any web challenge.

Players connect with either:
- **pwntools** via a custom `connect.py` wrapper (same API as `remote()`)
- **websocat** from the CLI (`cargo install websocat --locked`)

We built a base Docker image (`base-nc`) with the bridge baked in. Challenge authors just extend it:

```dockerfile
FROM base-nc
COPY chall.py /app/chall.py
ENV CHALL_CMD="python3 /app/chall.py"
```

We also registered a custom **netcat** challenge type in CTFd. When a player launches one, the UI shows connection instructions with the `connect.py` download link, pwntools example, and websocat command — auto-filled with the instance URL.

# The Remote Workflow

I'm in NYC. The server is in Ohio. I never SSH in.

**Pushing challenges**: `./build-challenges.sh my-chall` builds a Docker image locally and pushes it through the Cloudflare Tunnel to a private Docker Registry running on the server. The registry is exposed at `reg-ctf.domain.tld` — same wildcard cert, same tunnel.

**Updating CTFd**: Push to git. A `deployer` container on the server polls every 2 minutes, auto-pulls, and restarts services if config changed.

**Admin**: Just the web UI. Everything else is automated.

The server operator's entire job: run `./setup.sh` once, then forget about it. If Docker resets, `docker compose up -d`. Data lives in named volumes that survive container recreation.

# The Cloudflare Tunnel Saga

Dashboard-created tunnels override local config. We needed wildcard subdomain routing (`*.domain.tld`), but the dashboard UI doesn't accept `*` in the subdomain field. And since dashboard tunnels push their config remotely, our local `config.yml` with the wildcard rule was being ignored.

The fix: create a **CLI-managed tunnel** instead. `cloudflared tunnel create` from the CLI produces a tunnel that reads local config and doesn't get overridden. We extracted the credentials, wrote the ingress rules, set up DNS with `cloudflared tunnel route dns`, and everything worked.

```yaml
# cloudflared config.yml
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: "*.domain.tld"
    service: http://nginx:80
  - hostname: domain-ctf.domain.tld
    service: http://nginx:80
  - service: http_status:404
```

# Lessons Learned

1. **Pin your versions**. frp, docker-py, everything. Upstream breaking changes will ruin your day.
2. **SELinux hates bind mounts**. On Fedora, every volume mount needs `:z` or `security_opt: - label:disable`. Or just `setenforce 0` if you're on Asahi and didn't ask for SELinux anyway.
3. **Named volumes > bind mounts** for anything you want to survive. `.data/` directories get deleted when you `rm -rf` the repo. Named volumes live in Docker's storage.
4. **Dashboard tunnels vs CLI tunnels**: if you need wildcards, use CLI. Dashboard tunnels are easier to set up but less flexible.
5. **The frpc config template**: if ctfd-whale's frpc integration breaks, check that the config template has `[common]` with the token. This took us an embarrassing amount of time.
6. **WebSocket bridges work great for nc challenges**. The latency is negligible and pwntools doesn't care that it's not raw TCP underneath.

# The Result

A fully self-hosted CTF platform where:
- Challenges launch with one click
- Each player gets their own container with a unique flag
- Everything goes through Cloudflare (free SSL, DDoS protection, no open ports)
- I push challenges from anywhere without server access
- The server operator's job is literally "run one script"
- It survives Docker resets, server reboots, and the general entropy of a home server in Ohio

Total cost: $0 (Cloudflare free tier + a computer that was already running).

Was it worth the 14 hours of debugging? Ask me after the first practice session.
