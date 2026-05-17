---
title: 'From Dusk Till Dawn 2026 Quals'
description: '16 solves, 6 writeups. we went hard on this one. italian CTF with rome finals for top 5.'
pubDate: '2026-05-09'
author: 'riverxia'
---

# From Dusk Till Dawn 2026

fibonhack/cyber saiyan's CTF. 24 hours of pure suffering. top 5 go to rome for finals (we didn't make it but we got close ok shut up). flag format: `DAJEROMA{...}` which is literally italian for "come on rome" lol.

we solved 16/22 challenges. here's writeups for the 6 we actually ground through ourselves.

---

## 4words — Crypto (65pts, 69 solves)

> "You have to be very fast"

java game server running "Connections" — group 16 words into 4 categories. easy right? except the "Blitz Challenge" gives you 800ms per round across 10 rounds, and rounds 5-10 SHA-256 hash every word with a secret server-side salt. so you can't even read the words. seems impossible.

### the trick

the PRNG (`ChaosPRNG`) is a 48-bit LCG. the `getFragment` endpoint leaks the upper 32 bits of the state. brute force the remaining 16 bits (65536 candidates, takes like 0.1s).

once you recover the seed, you can predict the shuffle permutation for every round. the game's `getAllWords()` returns words in deterministic sorted order — positions 0-3 are always group 0, 4-7 group 1, etc. so even with hashed words, invert the shuffle = instant solve.

```
seed fragment → brute 16 bits → verify on plaintext round 1 → predict all shuffles → gg
```

---

## IntegrityCore — Pwn (75pts, 64 solves)

> "The system administrator needs to verify the integrity of /flag.txt"

plugin manager binary with a long blocklist of dangerous env vars (PATH, LD_PRELOAD, LD_LIBRARY_PATH, BASH_ENV, etc). you can import configs that set env vars and run an "admin verify" that calls `iconv` on `/flag.txt`.

### the trick

they forgot `GCONV_PATH`. classic.

1. upload a malicious `.so` with raw syscalls (open/read/write) as a gconv module
2. upload a `gconv-modules` file registering encoding `EVIL`
3. import config: `GCONV_PATH=/tmp/plugins`
4. admin verify with encoding `EVIL` → `iconv -t "EVIL//IGNORE"` loads our `.so` → reads flag

the `.so` used raw x86-64 syscalls because there's no libc linking available in gconv modules. fun times writing assembly for a CTF.

---

## extremely Bad Password Filter — Rev (79pts, 66 solves)

> "why use simple chars when you have a whole system at your disposal?"

x86-64 binary embedding an eBPF tracepoint handler on `raw_syscalls/sys_enter`. it monitors syscalls of a target process and derives a password character by character.

### the trick

extracted the embedded eBPF ELF at offset 0x3d1b8, disassembled `track_syscalls`. it maintains a counter (0-159), checks syscall numbers against a pattern array `jitter_p` (40 values, cycled), and on match computes:

```
char = ((value_array[idx] + tier) & 0xFF) ^ syscall_number
```

where tier is {1, 2, -1, -2} depending on position. four value arrays, 10 chars each, spell out "Born for networks, not security" in l33tspeak. name makes sense now — **e**xtremely **B**ad **P**assword **F**ilter = eBPF.

---

## Diffie-Hellman? — Crypto (158pts, 33 solves)

> "Looks to me like a standard dh key exchange"

DH with g=2 over a big prime. private keys from `random.getrandbits(2235)` (python's MT19937). unlimited oracle queries — each creates a fresh "Charlie" party consuming 70 MT words.

### the trick

**parity oracle**: send P-1 as your public key. `pow(P-1, priv, P)` = 1 if priv is even, P-1 if priv is odd. try both decryptions to learn each Charlie's private key LSB.

the LSB of `temper(state[index])` is a **linear function over GF(2)** of the MT state bits. each oracle query gives one equation. track the state symbolically through twists, build a massive GF(2) linear system.

21,000 queries. ~2,356 MT twist generations. gaussian elimination with packed uint64 representation. 19,937 pivots. recover the full initial state → derive Alice's private key → decrypt flag.

this one took ~53 minutes of pure grinding against the remote. worth it.

---

## asso — Web (158pts, 29 solves)

> "We're Key-cloaked from head to toe"

keycloak SSO system. flag store SPA at `/app/flag/` needs `resource_access.app-flag.roles: ["access"]` in your JWT. normal users don't have the `access` role.

### the trick

1. find the test-dev dashboard → leaks the admin console client ID: `app-admin-console-c4f3b4b3`
2. hit `/app/admin-console-c4f3b4b3/auth/config` → **leaks the client secret** in plaintext
3. `client_credentials` grant with leaked secret → service account token with `access` role
4. present token to `/app/flag/api/flag` → flag

SSO misconfiguration speedrun any%. the client secret was literally just sitting in a public config endpoint.

---

## PSP is love, PSP is life — Pwn (138pts, 28 solves)

> "Check out this BRAND NEW GAME!"

PSP homebrew visual novel (MIPS-II ELF). submit a save file, server runs it in PPSSPP and captures a screenshot.

### the trick

`load_save_data` reads 0x800 bytes into a stack buffer of 0x458 bytes. classic bof. `$ra` is at `$fp+0x454`.

the game loads `secret.txt` (encrypted flag) into a global buffer but never calls the decryption function. BSS is executable on PSP/PPSSPP.

save file layout:
- starts with `SKIP=1\n` (triggers save loading)
- at offset 0x434: overwrite `$ra` → shellcode address in save buffer
- shellcode brute-forces all 256 XOR keys, checks if decrypted output starts with 'D', renders the flag using OSLib draw functions

server screenshots the PPSSPP window. flag appears on screen. beautiful.

---

## final thoughts

16/22 is solid for a 24hr CTF. the ones we couldn't crack: Shaka (informix JDBC with no outbound networking — absolutely demonic), Innuendo (halo2 ZK proof forgery — we wrote a phd thesis worth of analysis and still couldn't find the exploit), and the remaining binary challenges (no x86 on our aarch64 daily driver, skill issue).

shoutout to fibonhack for a genuinely good CTF. the challenges were creative and well-balanced. see you in the next one o7
