---
title: 'Web: Paper 2'
description: 'CSS attribute selectors meet Redis LRU eviction in a 500-point side-channel challenge.'
pubDate: '2026-03-22'
author: 'riverxia'
---

# paper 2

500 points, @ehhthing. web app where you upload files and have a headless chrome bot visit them. bot sets a 32-char hex secret as an attribute on `<body>` and we need to steal it to get the flag from `/flag`. catch: `script-src 'none'` CSP, URLBlocklist blocks everything except the challenge origin. no js, no exfil to external servers. pure css side-channel.

also this challenge made me realize i'm pansexual. anyways.

server: bun + redis (512MB, `allkeys-lru`, `maxmemory-samples=5`). uploaded files live in redis with 10-min TTL. `/secret` renders `<body secret="${secret}">PAYLOAD</body>` where we control PAYLOAD. `/flag` uses `getdel` — one guess, 60-second expiry.

## the idea

css attribute selectors can match the secret without js:

```css
body[secret*="ab"] #marker_ab { background: url(/paper/SOME_ID) }
body[secret^="f"]  #prefix_f  { background: url(/paper/OTHER_ID) }
```

matching selectors trigger http requests to load background images. non-matching ones don't. but since we can't exfil to external servers, we need to observe which requests chrome made using *only* the challenge server itself.

enter redis LRU eviction.

## the side-channel

`allkeys-lru` samples 5 random keys when memory is full and evicts the least recently used. a key that was recently accessed has its LRU timestamp refreshed and survives. an untouched key stays old and gets evicted first.

the attack:
1. upload tiny marker files (100 bytes) for every bigram (`aa`...`ff`, 256 total), prefix char, suffix char, and trigram (`aaa`...`fff`, 4096 total). these are now the oldest keys.
2. wait 10 seconds — LRU gap between markers and everything uploaded after.
3. upload css/html: stylesheets with `body[secret*="XY"]` rules pointing at markers.
4. flood redis with 4000 large (60KB) files. memory full.
5. trigger the bot. chrome renders css, requests background-images for *matching* markers → refreshes their LRU timestamps.
6. upload 5000 more large files. redis evicts the oldest — non-accessed markers.
7. check which markers survived. surviving markers = bigrams/trigrams in the secret.

## the details

### multiple copies for confidence

LRU with `maxmemory-samples=5` is probabilistic — recently-accessed keys can still get unlucky. upload 5 copies of each marker and require 3+ to survive. P(false positive) ≈ 0.15% per bigram while tolerating ~5% per-copy loss.

### iframe nesting

URLAllowlist only permits `https://web`. can't load external resources, but we can nest iframes within the challenge origin:

```
entry page (/paper/ENTRY_ID)
  → iframe: wrapper.html
       → iframe: /secret?payload=<link rel=stylesheet href=/paper/CSS_ID><i id=bab></i>...
```

17 iframes total: 5 for bigram copies, 12 for trigram chunks (350 trigrams per iframe to stay under 8KB payload limit).

### euler path reconstruction

the 31 bigrams of a 32-char string form a directed graph where each bigram is an edge. the secret is an euler path through this graph. with detected prefix and suffix, enumerate all paths via DFS.

multiple valid paths → trigram scoring. each candidate: +10 for each detected trigram, -100 for each absent. correct path scores ~300 (all 30 trigrams match).

### algebraic edge recovery

sometimes we detect 29-30 bigrams instead of 30-31 (LRU noise). instead of brute-forcing:

```python
bal = {node: out_degree - in_degree for each node}
# target: bal[prefix] = +1, bal[suffix] = -1, rest = 0
# nodes needing +adjustment → must be first char of added edge
# nodes needing -adjustment → must be second char of added edge
```

typically 1-2 candidate edge sets, computed in microseconds.

## solve

```python
#!/usr/bin/env python3
MARKER_SIZE = 100    # tiny markers
FLOOD_COUNT = 4000   # 4000 x 60KB = ~240MB flood
EVICT_COUNT = 5000   # 5000 x 60KB = ~300MB eviction pressure
N_COPIES    = 5      # 5 copies per bigram marker
THRESHOLD   = 3      # require 3/5 to survive
LRU_GAP     = 10     # 10s gap between markers and flood
CHROME_WAIT = 15     # 15s for chrome to finish
```

full solver (~430 lines of python with `aiohttp`). uploads ~15,000 keys, triggers the bot, evicts, checks ~5,500 markers, reconstructs the secret, prints the flag. runs in 40-50 seconds — well within the 60-second TTL.

## flag

```
$ python3 solve.py "https://lonely-island.picoctf.net:58305"

[1/9] Uploading 5536 markers (100B each)...
  5536/5536 OK (2.4s)

[4/9] Triggering bot...
  visiting!

[6/9] Checking markers (28s since trigger)...
  355/5536 alive
  Bigrams: 30, Trigrams: 169

[7/9] Reconstructing (29s since trigger, 31s left)...
  pre=4 suf=c +['f1']: 2 paths, top=80

[8/9] Submitting: 47d97442f16b0ff175bd621b23f463ac

  picoCTF{i_l1ke_frames_on_my_canvas_953d5fff}
```
