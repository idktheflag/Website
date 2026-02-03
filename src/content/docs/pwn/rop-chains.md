---
title: ROP Chains
description: Return-Oriented Programming techniques
---

## What is ROP?

Return-Oriented Programming (ROP) is an exploitation technique that chains together small code sequences ending in a `ret` instruction (called "gadgets") to perform arbitrary operations without injecting new code.

## Why Use ROP?

Modern security mitigations like DEP/NX prevent executing code from the stack or heap. ROP bypasses this by reusing existing executable code in the binary or loaded libraries.

## Basic ROP Chain

A simple ROP chain might look like:

```
[gadget1_address]  # pop rdi; ret
[argument]
[system_address]
["/bin/sh" string]
```

## Finding Gadgets

Use tools like ROPgadget:

```bash
ROPgadget --binary vulnerable_binary
```

## Common Gadgets

- `pop rdi; ret` - Load first argument (x64)
- `pop rsi; ret` - Load second argument (x64)
- `pop rdx; ret` - Load third argument (x64)
- `ret` - Stack alignment

## Tips

- Ensure stack alignment (16-byte for x64)
- Use libc gadgets for more flexibility
- Consider one_gadget for quick wins
