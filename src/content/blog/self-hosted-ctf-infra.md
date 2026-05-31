---
title: 'How We Built a Self-Hosted CTF Platform (From Scratch-ish)'
description: 'Custom CTFd deployment with Cloudflare Tunnel, per-player instancing, WebSocket bridge for nc challenges, and a theme that actually looks good.'
pubDate: '2026-03-26'
author: 'riverxia'
---

# why self-host?

we wanted to practice. not "do random CTFs when they happen" practice — actual controlled "here are challenges we wrote for each other" practice. the kind where you can leave challenges up for weeks.

hosted CTFd costs money and doesn't let you do per-player docker containers. so we self-hosted. on a teammate's home server. in ohio. through a cloudflare tunnel. because why make anything easy.

## the stack

- CTFd — open source, flask-based
- docker swarm — orchestrates challenge containers
- ctfd-whale — CTFd plugin for per-player container provisioning
- frp (v0.48) — routes traffic to dynamically provisioned containers
- cloudflare tunnel — exposes everything without opening ports
- nginx — reverse proxy, subdomain routing
- custom theme — default CTFd theme is boring

all orchestrated with docker compose. starts with one command.

## the architecture

```
Player's Browser
  → Cloudflare (TLS termination, free wildcard cert)
    → cloudflared tunnel
      → nginx
        ├── main site          → CTFd
        ├── challenge instances → frps → per-player Docker containers
        └── private registry   → Docker Registry v2
```

every challenge instance gets a unique subdomain: `<uuid>-ctf.domain.tld`. wildcard SSL covers `*.domain.tld` — `abc123-ctf.domain.tld` just works. no per-challenge cert provisioning, no port forwarding.

## the theme

CTFd's default theme looks like every other CTFd instance. we rewired it to match our site — dark background, red accents, terminal aesthetic.

CTFd themes are jinja2 templates + SCSS compiled with vite. copied the `core` theme and:

- colors: bootstrap variable overrides — `$body-bg: #0d1117`, `$primary: #ff4b4b`, `$card-bg: #161b22`
- fonts: replaced lato/raleway with atkinson hyperlegible
- dark mode only: gutted the toggle, forced `data-bs-theme="dark"`
- animations: cards lift on hover, challenge buttons glow red, CRT scanlines, blinking cursor on prompts
- navbar: red bottom border, blur backdrop

builds with `npx vite build`. select it in the admin panel, works.

## per-player instancing

CTFd doesn't natively support per-player containers. ctfd-whale handles it:

1. player clicks "Launch"
2. ctfd-whale creates a docker swarm service
3. unique flag injected via `FLAG` env var
4. frp registers a subdomain route
5. player gets `https://uuid-ctf.domain.tld/`
6. container auto-destroys after timeout

the gotchas:

- **frp version matters.** ctfd-whale sends INI-format config to frpc's admin API. frp v0.50+ switched to TOML/JSON. we pinned to v0.48.0.
- **the `[common]` section.** frpc 0.48's admin API returns config without `[common]`, but the reload endpoint requires it. had to manually set the config template in CTFd's database.
- **docker socket permissions.** CTFd runs as non-root. docker socket needs root. set `user: root` in docker-compose. it's a home server, not fort knox.
- **the docker python package.** ctfd-whale pins `docker==4.1.0` which doesn't work with `urllib3>=2.0`. bumped to `docker>=7.0.0`.

## the nc challenge problem

web challenges work great with subdomain routing. but pwn/nc challenges need raw TCP — and cloudflare tunnel doesn't proxy arbitrary TCP.

options we considered:
- port forwarding on the router → server operator has to configure things (bad)
- tailscale VPN → everyone installs software (bad)
- `cloudflared access tcp` on client side → everyone installs a binary (bad)

our solution: **websocket bridge**. challenge containers run a python WebSocket server on port 80 that spawns the challenge binary and bridges stdin/stdout over WebSocket. from the outside it's HTTP — goes through the tunnel like any web challenge.

players connect with pwntools via a custom `connect.py` wrapper or websocat from the CLI. we built a base docker image (`base-nc`) with the bridge baked in. challenge authors extend it:

```dockerfile
FROM base-nc
COPY chall.py /app/chall.py
ENV CHALL_CMD="python3 /app/chall.py"
```

we also registered a custom netcat challenge type in CTFd. when a player launches one, the UI shows connection instructions auto-filled with the instance URL.

## the remote workflow

i'm in NYC. the server is in ohio. i never SSH in (except for building challs and every other thing because i'm on aarch64 [asahi linux] and we're targeting amd64).

pushing challenges: `./build-challenges.sh my-chall` builds locally and pushes through the cloudflare tunnel to a private docker registry at `reg-ctf.domain.tld`.

updating CTFd: push to git. a `deployer` container polls every 2 minutes, auto-pulls, restarts if config changed.

admin: just the web UI. everything else is automated.

## the cloudflare tunnel saga

dashboard-created tunnels override local config. we needed wildcard subdomain routing (`*.domain.tld`) but the dashboard UI doesn't accept `*`. and since dashboard tunnels push their config remotely, our local `config.yml` was being ignored.

fix: create a **CLI-managed tunnel** instead. `cloudflared tunnel create` from the CLI produces a tunnel that reads local config and doesn't get overridden.

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

## lessons learned

- pin your versions. frp, docker-py, everything. upstream breaking changes will ruin your day.
- SELinux hates bind mounts. on fedora, every volume mount needs `:z` or `security_opt: - label:disable`. or just `setenforce 0` if you're on asahi and didn't ask for SELinux anyway.
- named volumes > bind mounts for anything you want to survive. `.data/` directories get deleted when you `rm -rf` the repo.
- dashboard tunnels vs CLI tunnels: if you need wildcards, use CLI.
- if ctfd-whale's frpc integration breaks, check that the config template has `[common]` with the token. this took an embarrassing amount of time.

## the result

fully self-hosted CTF platform. challenges launch with one click, each player gets their own container with a unique flag, everything through cloudflare, i push challenges from anywhere, server operator runs one script and forgets about it.

total cost: $0. cloudflare free tier + a computer that was already running.

this is actually physically better than picoCTF's config, which also uses docker instead of k8s for some reason. ivan, what the ACTUAL FUCK are you doing. you are the largest CTF, period. our ohio home server setup works better than yours.

was it worth the 14 hours of debugging? ask me after the first practice session.
