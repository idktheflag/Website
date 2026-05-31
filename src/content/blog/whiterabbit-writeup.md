---
title: 'Crypto: White Rabbit'
description: 'Known-plaintext XOR crib attack on a fake PDF to recover a 16-byte repeating key.'
pubDate: '2026-03-26'
author: 'riverxia'
---

# white rabbit

metactf. we get `whiterabbit.pdf` (418,224 bytes). doesn't open as a pdf.

## not a pdf

```bash
$ file whiterabbit.pdf
whiterabbit.pdf: data

$ xxd whiterabbit.pdf | head -3
00000000: 4d64 272d 195d 4240 6216 4390 9abf e43a  Md'-.]B@b.C....:
00000010: 5b3e 5361 5b0e 067e 540f 695d 2d09 4755  [>Sa[..~T.i]-.GU
00000020: 621b 200a 400d 001b 0f39 4c3c 181d 5243  b. .@....9L<..RC
```

no `%PDF` magic bytes. encrypted with something.

## known-plaintext xor crib

it's supposed to be a pdf, so the first 7 bytes are `%PDF-1.` (0x255044462d312e). xor ciphertext with that:

```python
data = open('whiterabbit.pdf', 'rb').read()
key_fragment = bytes(a ^ b for a, b in zip(data[:7], b'%PDF-1.'))
print(key_fragment)  # b'h4ck4ll'
```

key starts with `h4ck4ll`. ok.

## key length

index of coincidence spikes hard at length 16 (IC = 0.00545 vs ~0.004 baseline). kasiski says the same thing. 16 bytes.

## recovering the full key

7 bytes down, 9 to go.

- byte 7: try each pdf version. `%PDF-1.4` gives `key[7] = 't'` → `h4ck4llt`
- bytes 8-9: guess "th3" for "the" → decrypts to valid pdf structure. confirmed `key[8:10] = 'h3'`
- bytes 10-15: cross-reference known pdf keywords at different offsets

| offset | decrypted | expected | key pos | diff |
|--------|-----------|----------|---------|------|
| 266 | `v` | `a` (/Pages) | 10 | 0x17 |
| 407322 | `x` | `o` (/Font) | 10 | 0x17 |
| 267 | `}` | `g` (/Pages) | 11 | 0x1A |
| 407323 | `t` | `n` (/Font) | 11 | 0x1A |
| 268 | `-` | `e` (/Pages) | 12 | 0x48 |

consistent diffs across independent offsets → `key[10:13] = 'cry'`

at this point the key is `h4ck4llth3cry...` which is obviously "hack all the crypto" in leet. so `h4ck4llth3cryp70`:

```python
key = b'h4ck4llth3cryp70'
dec = bytes(data[i] ^ key[i % 16] for i in range(len(data)))
print(dec.count(b'%%EOF'))   # 1
print(dec.count(b'/Pages'))  # 2
print(dec.count(b'endobj'))  # 33
```

valid pdf. gg.

## flag

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

## solve script

```python
#!/usr/bin/env python3
data = open('whiterabbit.pdf', 'rb').read()
key = b'h4ck4llth3cryp70'
dec = bytes(data[i] ^ key[i % 16] for i in range(len(data)))
open('decrypted.pdf', 'wb').write(dec)
```
