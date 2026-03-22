---
title: 'Web: Paper 2'
description: 'CSS attribute selectors meet Redis LRU eviction in a 500-point side-channel challenge.'
pubDate: '2026-03-22'
author: 'riverxia'
---

# The Challenge

**Paper 2** (500 pts) by @ehhthing. Also made me figure out I'm pansexual. We're given a web app where you can upload files and have a headless Chrome bot visit them. The bot sets a 32-character hex secret as an attribute on `<body>`, and we need to steal it to retrieve the flag from `/flag`. The catch: `script-src 'none'` CSP blocks all JavaScript, and Chrome's URLBlocklist is `['*']` with only `['https://web']` allowlisted. No JS, no exfiltration to external servers. Pure CSS side-channel.

The server runs on Bun with Redis (512MB, `allkeys-lru`, `maxmemory-samples=5`) as the backing store. Uploaded files live in Redis with a 10-minute TTL. The `/secret` endpoint renders `<body secret="${secret}">PAYLOAD</body>` where we control `PAYLOAD` via query param. The `/flag` endpoint uses `getdel` -- one guess per bot visit, and the secret expires after 60 seconds.

## The Idea

CSS attribute selectors can match against the secret without JavaScript:

```css
body[secret*="ab"] #marker_ab { background: url(/paper/SOME_ID) }
body[secret^="f"]  #prefix_f  { background: url(/paper/OTHER_ID) }
body[secret$="1"]  #suffix_1  { background: url(/paper/ANOTHER_ID) }
```

When Chrome renders this CSS, matching selectors trigger HTTP requests to load background images. Non-matching selectors don't. But with URLBlocklist blocking everything except the challenge origin, we can't exfiltrate these signals to an external server. We need a way to observe *which requests Chrome made* using only the challenge server itself.

Enter the Redis LRU eviction side-channel.

## The Side-Channel

Redis is configured with `allkeys-lru` eviction. When memory is full, it samples 5 random keys and evicts the least recently used one. A key that was recently accessed (via `GET`) has its LRU timestamp refreshed and survives eviction. A key that hasn't been touched stays "old" and gets evicted first.

The attack:

1. **Upload tiny marker files** (100 bytes each) for every possible bigram (`aa`, `ab`, ..., `ff` -- 256 total), prefix char, suffix char, and trigram (`aaa` through `fff` -- 4096 total). These markers are the oldest keys in Redis.
2. **Wait 10 seconds** to create an LRU gap between markers and everything uploaded after.
3. **Upload CSS/HTML infrastructure** -- stylesheets with `body[secret*="XY"]` rules pointing at markers, wrapper iframes, and an entry page.
4. **Flood Redis** with 4000 large (60KB) files. These fill the cache and are newer than the markers.
5. **Trigger the bot.** Chrome visits our entry page, renders CSS, and makes background-image requests for *matching* markers only. Those `GET` requests refresh the markers' LRU timestamps.
6. **Upload 5000 more large files** (eviction pressure). Redis evicts the oldest keys first -- the non-accessed markers. Accessed markers survive because Chrome refreshed their LRU timestamps.
7. **Check which markers still exist.** Surviving markers = bigrams/trigrams present in the secret.

## The Details

### Multiple Copies for Confidence

LRU eviction with `maxmemory-samples=5` is probabilistic. A recently-accessed key can still get unlucky and be evicted. To deal with this, we upload **5 copies** of each bigram/prefix/suffix marker and require **3+ copies** to survive for detection. This gives near-zero false positive rate (P(FP) ~ 0.15% per bigram) while tolerating ~5% per-copy loss from LRU sampling noise.

### Iframe Nesting

Chrome's URLAllowlist only permits `https://web`. We can't load external resources, but we can nest iframes within the challenge origin:

```
Entry page (/paper/ENTRY_ID)
  -> iframe: wrapper.html (/paper/WRAPPER_ID)
       -> iframe: /secret?payload=<link rel=stylesheet href=/paper/CSS_ID><i id=bab></i>...
```

Each wrapper iframe loads `/secret` with a payload containing a `<link>` to our CSS stylesheet and `<i>` elements with IDs matching the CSS selectors. We use 17 iframes total: 5 for bigram copies and 12 for trigram chunks (350 trigrams per iframe to stay under the 8KB payload limit).

### Euler Path Reconstruction

The 31 bigrams of a 32-character string form a directed graph where each bigram is an edge (first char -> second char). The secret is an Euler path through this graph. With the detected prefix (start node) and suffix (end node), we enumerate all Euler paths using DFS.

Multiple valid paths may exist, so we use **trigram scoring** to disambiguate. Each candidate path is scored: `+10` for each trigram present in the detected set, `-100` for each trigram absent. The correct path scores ~300 (all 30 trigrams match), while wrong paths score much lower.

### Algebraic Edge Recovery

Sometimes we detect 29-30 bigrams instead of the full 30-31 (LRU noise). Instead of brute-forcing all C(256, n) possible additions, we compute exactly which edges fix the degree balance:

```python
# Compute degree deficit
bal = {node: out_degree - in_degree for each node}
# Target: bal[prefix] = +1, bal[suffix] = -1, rest = 0
# Nodes needing +adjustment -> must be first char of added edge
# Nodes needing -adjustment -> must be second char of added edge
```

This reduces the search from tens of thousands of combinations to typically 1-2 candidate edge sets, computed in microseconds.

## The Solve

```python
#!/usr/bin/env python3
# Key parameters (tuned through extensive local testing):
MARKER_SIZE = 100    # Tiny markers (100 bytes)
FLOOD_COUNT = 4000   # 4000 x 60KB = ~240MB flood
EVICT_COUNT = 5000   # 5000 x 60KB = ~300MB eviction pressure
N_COPIES    = 5      # 5 copies per bigram marker
THRESHOLD   = 3      # Require 3/5 copies to survive
LRU_GAP     = 10     # 10s gap between markers and flood
CHROME_WAIT = 15     # 15s for Chrome to finish loading
```

The full solver (~430 lines of Python with `aiohttp`) runs the complete pipeline in about 40-50 seconds, well within the 60-second secret TTL. It uploads \~15,000 keys to Redis, triggers the bot, performs eviction, checks \~5,500 markers, reconstructs the secret, and prints the flag.

## The Flag

```
$ python3 solve.py "https://lonely-island.picoctf.net:58305"
=== Paper-2 Solver ===
Target: https://lonely-island.picoctf.net:58305

[1/9] Uploading 5536 markers (100B each)...
  5536/5536 OK (2.4s)

[4/9] Triggering bot...
  visiting!

[6/9] Checking markers (28s since trigger)...
  355/5536 alive
  Bigrams: 30, Trigrams: 169

[7/9] Reconstructing (29s since trigger, 31s left)...
  pre=4 suf=c +['f1']: 2 paths, top=80

[8/9] Submitting: 47d97442f16b0ff175bd621b23f463ac (29s since trigger)

  ══════════════════════
  picoCTF{i_l1ke_frames_on_my_canvas_953d5fff}
  ══════════════════════
```

Flag secured: `picoCTF{i_l1ke_frames_on_my_canvas_953d5fff}`
