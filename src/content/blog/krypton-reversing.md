---
title: 'Reversing KryptonPlus: Tearing Apart a Minecraft Rat'
description: 'Full static analysis of a JNI-obfuscated Minecraft cheat client with a bundled RAT — custom Zig AOT compiler, IEEE 754 string encryption, and goto-spaghetti bytecode decryption.'
pubDate: '2026-05-02'
author: 'riverxia'
---

# krypton plus

zemi tried to crack a paid minecraft hacked client called "KryptonPlus." the jar looked legitimate: proper fabric mod structure, `fabric.mod.json` identifying it as BetterF3, all the right metadata. he ran it. he got ratted.

we got the jar. we tore it apart.

not a skid's first malware project. full-featured cheat client (20+ modules, custom render pipeline, 45 mixin hooks) with a dual-channel C2 RAT, all compiled through a custom Java-to-native transpiler called JNT3. every string encrypted. every class name obfuscated. entire codebase AOT-compiled into platform-specific native libraries using zig.

and then they left the license key in a plaintext file.

## initial triage

```bash
$ unzip -l KryptonPlus-windows-x86-imattas.jar | head -20
```

the jar has:
- ~300 obfuscated java classes with 2-3 letter names (`wl`, `bn`, `cx`, `kq`...)
- legitimate-looking classes under `dev/krypton/mixin/` (45 mixin hooks)
- `dev/krypton/Main.class` — fabric mod entrypoint
- `dev/krypton/jnt3/Loader.class` — native library loader
- four gzipped native binaries:

| file | platform | decompressed size |
|------|----------|------------------|
| `x86_64-linux-gnu` | linux | 15 MB |
| `x86_64-windows` | windows | 18 MB |
| `x86_64-macos` | macOS intel | 15 MB |
| `aarch64-macos` | macOS apple silicon | 18 MB |

the `fabric.mod.json` claims to be BetterF3 by cominixo, but the entrypoint is `dev.krypton.Main`. nobody checking their mod list would think twice about a debug HUD mod.

and sitting in the jar root:
```
$ cat licenseKey
1PQZQ7MZRZNTJB3WTW2EMPYGXJDY8
```

## the JNT3 framework

`Loader.class` has three key components:
1. `decompress(byte[])` — intentionally crafted to crash CFR/Procyon decompilers
2. `static {}` initializer — extracts and loads the platform-specific native binary
3. `native void init(Class<?>)` — bootstraps the JNI runtime
4. `native void guard()` — anti-tamper checks

flow:
```
minecraft launches
  → fabric loads "BetterF3" (actually KryptonPlus)
    → Main.<clinit>() calls Loader.init(Main.class)
      → Loader extracts gzipped native lib to temp file
        → System.load()
          → JNI registers 146 native methods across 19 classes
            → Main.onInitialize() runs (native) — RAT begins
```

every significant method is `native`. the java classes are empty shells.

## analyzing the native binary

```bash
$ readelf --dyn-syms x86_64-linux-gnu | grep "FUNC.*GLOBAL" | wc -l
180

$ readelf -d x86_64-linux-gnu
  NEEDED: libm.so.6
  NEEDED: libc.so.6
```

18MB DLL that imports less than a hello world.

the binary exports 146 `JNT_*` functions (mapped to java classes), plus a full JNI reflection runtime. the `JNT_*` functions map to the obfuscated classes:

```
JNT_cx_*  → ConfigManager     (14 funcs, 2.8 MB total)
JNT_iw_*  → RestApiClient     (8 funcs, 2.2 MB)
JNT_wl_*  → KryptonClient     (15 funcs, 1.0 MB)
JNT_lj_*  → Cipher engine     (10 funcs, 976 KB)
JNT_kj_*  → Key schedule      (5 funcs, 785 KB)
```

the single largest function (`JNT_iw_ewj`) is 1.03MB of compiled code. it's an async HTTP GET handler. a typical compiled function is a few KB.

## zero strings

```bash
$ strings x86_64-linux-gnu | grep -iE "discord|token|http|api"
(nothing)
```

all 51,000 strings encrypted. only readable strings are zig runtime errors and linker identification. every URL, class name, method name, API endpoint — encrypted through `jnt_decode_string` at runtime.

## mapping the architecture

through `javap` disassembly of all 300+ classes we mapped the entire client.

the RAT:

| obfuscated | real name | purpose |
|------------|-----------|---------|
| `kl` | C2Client | HTTP C2 hub — `java.net.http.HttpClient` + gson |
| `iw` | RestApiClient | async REST — license validation, command fetch |
| `yp` | WebSocketClient | raw NIO WebSocket for real-time C2 |
| `swb` | ConnectionHandler | frame-level connection management |
| `sw` | SystemInfo | fingerprints the machine (OS, user, HWID, hardware) |

dual-channel C2: REST for request/response (license check, config fetch, data exfil) and WebSocket for real-time commands. the WebSocket is hand-rolled RFC 6455 using `java.nio.channels.SelectionKey` — not a library.

custom crypto stack — 6 classes, custom block cipher, 8 cipher modes, key expansion function that compiles to 436KB (standard AES-256 key schedule is ~2KB — this is either a custom cipher or heavily inlined).

also a full cheat client with 20+ modules: KillAura, AimBot, ESP, Freecam, SpeedHack, Scaffold, Reach, Timer, AntiBot, HitboxModifier, AutoReconnect, etc. complete GUI with settings, color picker, keybind editor. all native.

## string decryption

the main challenge. without decrypting strings we can't find the C2 URLs, what data the RAT steals, command protocol, API endpoints.

### the native decoder

the binary exports `jnt_decode_string` — a 5,454-byte function:

```c
void jnt_decode_string(uint16_t* buffer, int length, int key);
```

operates in-place on UTF-16. `key` (0-16) selects one of 17 transformation chains via a jump table. each chain applies reversible bit operations — shifts, masks, XOR with constants, addition, and IEEE 754 float-component packing with masks like `0x7fff00000000`. the `pow()` glibc import exists literally for the string decryptor. they encode character values as IEEE 754 double-precision float components.

### unicorn verification

we used unicorn CPU emulator to run the native x86_64 code on our aarch64 machine:

```python
from unicorn import *
from unicorn.x86_const import *

mu = Uc(UC_ARCH_X86, UC_MODE_64)
# map ELF segments...

test_chars = [0x905a, 0x50a1, 0x90a3, 0x90a3, 0xd0a2]
result = decode_string(mu, test_chars, 16)
# result: "Hello" ✓
```

### the java bootstrap decoder

most strings are decoded by java bootstrap methods, not the native function. each class has a bootstrap method named `"0"` or `"1"` handling `InvokeDynamic` resolution:

```
InvokeDynamic #0:JNT:()Ljava/lang/Object;
```

bootstrap args: `[int, encrypted_class, encrypted_method, encrypted_descriptor, int]`

the bootstrap decrypts the three strings then calls `MethodHandles.Lookup.findStatic/findVirtual/findConstructor` with the decrypted names.

problem: these bootstraps are **heavily obfuscated with goto-spaghetti**. a typical bootstrap has ~650 instructions with 243 goto jumps and 240 unique jump targets. every instruction jumps somewhere else. linear disassembly is meaningless.

### building a JVM interpreter

since we couldn't run the native library on aarch64 linux (no binary exists for our platform), we built a python-based java bytecode interpreter that:

1. parses the `.class` file constant pool, methods, and bootstrap method table
2. interprets every java bytecode: stack ops, arithmetic, bitwise, control flow including the goto spaghetti
3. simulates `StringBuilder.append(char)` to capture decoded characters
4. intercepts `MethodHandles.Lookup.findStatic/findVirtual` calls to capture decoded class/method/descriptor names
5. runs against all 979 bootstrap entries across 338 class files

```python
while pc < len(code) and steps < MAX_STEPS:
    op = code[pc]
    if op == 0xA7:    # goto
        offset = int.from_bytes(code[pc+1:pc+3], 'big', signed=True)
        pc += offset
    elif op == 0x82:  # ixor
        b, a = stack.pop(), stack.pop()
        stack.append((a ^ b) & 0xFFFFFFFF)
    elif op == 0x92:  # i2c
        stack.append(stack.pop() & 0xFFFF)
    # ... 50+ more opcodes ...
```

~1,700 lines of python. ran against all classes, produced decoded strings for every encrypted reference.

## the deobfuscated architecture

with all strings decrypted: **37 java files, 3,064 lines** — complete class/method/field mappings. compilable fabric mod project with gradle, javadoc comments mapping every field back to its obfuscated name.

## the irony

they built:
- a custom java-to-native transpiler (JNT3) using zig
- cross-platform native binaries for 4 architectures
- a custom cryptographic stack with 8 cipher modes
- IEEE 754 float-component string encryption
- goto-spaghetti obfuscation with 240+ jump targets per method
- anti-decompiler tricks that crash CFR and procyon
- a full cheat client with 20+ modules and custom rendering

and left the license key in a plaintext file called `licenseKey`.

---

*analysis by the idktheflag team. tools: recaf 4.x, javap, readelf, objdump, python, unicorn engine.*
