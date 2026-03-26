---
title: 'Crypto: White Rabbit'
description: 'Known-plaintext XOR crib attack on a fake PDF to recover a 16-byte repeating key.'
pubDate: '2026-03-26'
author: 'riverxia'
---

# The Challenge

**White Rabbit** from MetaCTF. We're given `whiterabbit.pdf` (418,224 bytes) and a prompt about hackers whispering secret codes to get into a room. Despite the `.pdf` extension, the file doesn't open as a PDF.

## Step 1 — Not a real PDF

```bash
$ file whiterabbit.pdf
whiterabbit.pdf: data

$ xxd whiterabbit.pdf | head -3
00000000: 4d64 272d 195d 4240 6216 4390 9abf e43a  Md'-.]B@b.C....:
00000010: 5b3e 5361 5b0e 067e 540f 695d 2d09 4755  [>Sa[..~T.i]-.GU
00000020: 621b 200a 400d 001b 0f39 4c3c 181d 5243  b. .@....9L<..RC
```

No `%PDF` magic bytes. The file is encrypted/obfuscated.

## Step 2 — Known-plaintext XOR crib

Since the file *should* be a PDF, we know the first 7 bytes of plaintext are `%PDF-1.` (0x255044462d312e). XOR the ciphertext with this known plaintext to recover the first 7 key bytes:

```python
data = open('whiterabbit.pdf', 'rb').read()
key_fragment = bytes(a ^ b for a, b in zip(data[:7], b'%PDF-1.'))
print(key_fragment)  # b'h4ck4ll'
```

Key starts with **`h4ck4ll`** ("hack all" in leet).

## Step 3 — Finding the key length

Index of Coincidence analysis across different key lengths shows a clear spike at **length 16** (IC = 0.00545 vs ~0.004 baseline). Kasiski examination confirms: trigram distance GCDs overwhelmingly favor powers of 2, peaking at 16.

## Step 4 — Recovering the full key

With a 16-byte repeating XOR key and the first 7 bytes known, I needed the remaining 9.

**Byte 7 (PDF version):** Trying each PDF version (1.0–1.9), `%PDF-1.4` gives `key[7] = 't'`, extending the key to `h4ck4llt`.

**Bytes 8–9:** Decrypting with `h4ck4llth3......` (guessing "th3" for "the") produced valid PDF structure (`endobj`, `/Type`, etc.) at offsets whose key positions fell within 0–9. This confirmed `key[8:10] = 'h3'`.

**Bytes 10–15:** Cross-referencing known PDF keywords at multiple offsets:

| Offset | Decrypted | Expected | Key pos | Diff |
|--------|-----------|----------|---------|------|
| 266 | `v` | `a` (/Pages) | 10 | 0x17 |
| 407322 | `x` | `o` (/Font) | 10 | 0x17 |
| 267 | `}` | `g` (/Pages) | 11 | 0x1A |
| 407323 | `t` | `n` (/Font) | 11 | 0x1A |
| 268 | `-` | `e` (/Pages) | 12 | 0x48 |

The consistent diffs across independent offsets confirmed the corrections. Applying them: `key[10:13] = 'cry'`.

The partial key `h4ck4llth3cry...` strongly suggests **"hack all the crypto"** in leet. Testing `h4ck4llth3cryp70` (with `p70` for "pto"):

```python
key = b'h4ck4llth3cryp70'
dec = bytes(data[i] ^ key[i % 16] for i in range(len(data)))
print(dec.count(b'%%EOF'))   # 1
print(dec.count(b'/Pages'))  # 2
print(dec.count(b'endobj'))  # 33
```

Valid PDF structure everywhere.

## Step 5 — Flag

```bash
$ pdftotext decrypted.pdf -
Follow the White Rabbit

Hacker Afterparty
Third door on your left using
the west entrance.
Bring drinks, snacks, your laptop.
Knock twice and whisper
MetaCTF{1n_th3_d00r_v1a_x0r}
```

## Solve script

```python
#!/usr/bin/env python3
data = open('whiterabbit.pdf', 'rb').read()
key = b'h4ck4llth3cryp70'
dec = bytes(data[i] ^ key[i % 16] for i in range(len(data)))
open('decrypted.pdf', 'wb').write(dec)
```

## Key takeaways

- Repeating-key XOR is trivially broken with known plaintext (PDF headers are a goldmine)
- Cross-referencing multiple known PDF structure keywords at different offsets locks in each key byte independently
- The key `h4ck4llth3cryp70` = "hack all the crypto" — fitting
