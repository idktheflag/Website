---
title: Introduction to Pwn
description: Getting started with binary exploitation
---

## What is Pwn?

Pwn (or binary exploitation) involves finding and exploiting vulnerabilities in compiled programs. This category focuses on memory corruption bugs, control flow hijacking, and other low-level exploitation techniques.

## Common Vulnerability Types

### Buffer Overflow
Buffer overflows occur when a program writes more data to a buffer than it can hold, potentially overwriting adjacent memory and allowing attackers to control execution flow.

### Use-After-Free
Use-after-free bugs happen when a program continues to use a pointer after the memory it points to has been freed, potentially allowing arbitrary code execution.

### Format String Vulnerabilities
Format string bugs allow attackers to read from or write to arbitrary memory locations by exploiting improper use of printf-family functions.

## Essential Tools

- **GDB with Pwndbg/GEF**: Debugger with enhanced features for exploitation
- **pwntools**: Python library for writing exploits
- **ROPgadget**: Tool for finding ROP gadgets in binaries
- **checksec**: Check binary security features

## Getting Started

1. Learn C programming and x86/x64 assembly
2. Understand memory layout (stack, heap, etc.)
3. Practice on platforms like pwnable.kr, pwnable.tw
4. Study common exploitation techniques
