---
title: Common RSA Attacks
description: Exploiting weak RSA implementations
---

## RSA Basics

RSA relies on the difficulty of factoring large numbers. The public key is `(n, e)` and private key is `(n, d)` where:
- `n = p * q` (product of two large primes)
- `e` is the public exponent
- `d` is the private exponent

## Common Attacks

### Small Public Exponent Attack

When `e` is small (often 3) and the message `m` is also small, `m^e` might be smaller than `n`. You can simply take the e-th root of the ciphertext.

```python
import gmpy2
c = ciphertext
e = 3
m = gmpy2.iroot(c, e)[0]
```

### Wiener's Attack

When `d` is small (less than `n^0.25`), you can use continued fractions to recover `d` from the public key.

### Common Modulus Attack

If two different public keys share the same modulus `n` but have different exponents, you can decrypt without the private key.

### Factorization Attacks

- **Small factors**: Use tools like factordb.com
- **Fermat's factorization**: When `p` and `q` are close
- **Pollard's rho**: For semi-smooth numbers

## Tools

- RsaCtfTool: `python3 RsaCtfTool.py -n <n> -e <e> --uncipher <c>`
- FactorDB: Online database of factored numbers
- SageMath: For mathematical computations
