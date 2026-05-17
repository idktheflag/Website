---
title: 'Reversing KryptonPlus: Tearing Apart a Minecraft Rat'
description: 'Full static analysis of a JNI-obfuscated Minecraft cheat client with a bundled RAT — custom Zig AOT compiler, IEEE 754 string encryption, and goto-spaghetti bytecode decryption.'
pubDate: '2026-05-02'
author: 'riverxia'
---

# Background

A friend of ours — we'll call him zemi — tried to crack a paid Minecraft hacked client called "KryptonPlus." The jar he downloaded looked legitimate: proper Fabric mod structure, `fabric.mod.json` identifying it as BetterF3 (a popular debug HUD mod), and all the right metadata. He ran it. He got ratted.

We got the jar. We tore it apart.

What we found wasn't a skid's first malware project — it was a genuinely sophisticated piece of work. A full-featured cheat client (20+ modules, custom render pipeline, 45 mixin hooks) with a dual-channel C2 RAT baked in, all compiled through a custom Java-to-native transpiler called **JNT3**. Every string in the binary was encrypted. Every class name was obfuscated. The entire codebase was AOT-compiled into platform-specific native libraries using Zig.

And then they left the license key in a plaintext file.

# Initial Triage

```bash
$ file KryptonPlus-windows-x86-imattas.jar
KryptonPlus-windows-x86-imattas.jar: Java archive data (JAR)

$ unzip -l KryptonPlus-windows-x86-imattas.jar | head -20
```

The jar contains:
- ~300 obfuscated Java classes with 2-3 letter names (`wl`, `bn`, `cx`, `kq`...)
- Legitimate-looking classes under `dev/krypton/mixin/` (45 Minecraft mixin hooks)
- `dev/krypton/Main.class` — the Fabric mod entrypoint
- `dev/krypton/jnt3/Loader.class` — the native library loader
- **Four gzipped native binaries** under `dev/krypton/jnt3/`:

| File | Platform | Decompressed Size |
|------|----------|------------------|
| `x86_64-linux-gnu` | Linux | 15 MB |
| `x86_64-windows` | Windows | 18 MB |
| `x86_64-macos` | macOS Intel | 15 MB |
| `aarch64-macos` | macOS Apple Silicon | 18 MB |

The `fabric.mod.json` is the first red flag:

```json
{
  "name": "BetterF3",
  "description": "Replaces Minecraft's original debug HUD...",
  "authors": ["cominixo", "TreyRuffy"],
  "entrypoints": {
    "main": ["dev.krypton.Main"]
  }
}
```

Claims to be BetterF3 by cominixo, but the entrypoint is `dev.krypton.Main`. Nobody checking their mod list would think twice about a debug HUD mod.

And sitting right there in the jar root:

```
$ cat licenseKey
1PQZQ7MZRZNTJB3WTW2EMPYGXJDY8
```

# The JNT3 Framework

This is where it gets interesting. The `Loader.class` has three key components:

1. A `decompress(byte[])` method — intentionally crafted to crash CFR/Procyon decompilers with nested loop confusion
2. A `static {}` initializer — extracts and loads the platform-specific native binary
3. `native void init(Class<?>)` — bootstraps the JNI runtime
4. `native void guard()` — anti-tamper checks

The flow:

```
Minecraft launches
  → Fabric loads "BetterF3" (actually KryptonPlus)
    → Main.<clinit>() calls Loader.init(Main.class)
      → Loader extracts gzipped native lib to temp file
        → System.load() loads the native library
          → JNI registers 146 native methods across 19 classes
            → Main.onInitialize() runs (native) — RAT begins
```

Every significant method in the client is `native`. The Java classes are empty shells — the actual logic lives in the Zig-compiled native binary.

## Analyzing the Native Binary

```bash
$ readelf --dyn-syms x86_64-linux-gnu | grep "FUNC.*GLOBAL" | wc -l
180

$ readelf -d x86_64-linux-gnu
  NEEDED: libm.so.6
  NEEDED: libc.so.6
```

Only two dependencies: libc and libm. An 18MB DLL that imports less than a hello world.

The binary exports 146 `JNT_*` functions (mapped to Java classes), plus a full JNI reflection runtime:

```
jnt_RegisterNatives      request_klass       lookup_method
request_method          request_virtual      make_object_*
unbox_*                 jnt_decode_string    decode_character
```

The `JNT_*` functions map to the obfuscated Java classes:

```
JNT_cx_*  → ConfigManager (14 funcs, 2.8 MB total!)
JNT_iw_*  → RestApiClient (8 funcs, 2.2 MB)
JNT_wl_*  → KryptonClient singleton (15 funcs, 1.0 MB)
JNT_lj_*  → Cipher engine (10 funcs, 976 KB)
JNT_kj_*  → Key schedule (5 funcs, 785 KB)
```

The single largest function is `JNT_iw_ewj` at **1.03 MB of compiled code** — an async HTTP GET handler. For comparison, a typical compiled function is a few KB.

### Zero Strings

```bash
$ strings x86_64-linux-gnu | grep -iE "discord|token|http|api"
(nothing)
```

All 51,000 strings in the binary are encrypted. The only readable strings are Zig runtime errors (`"array index out of bounds"`) and the linker identification. Every URL, class name, method name, and API endpoint is encrypted through `jnt_decode_string` at runtime.

# Mapping the Architecture

Through `javap` disassembly of all 300+ classes, we mapped the entire client:

## The RAT

| Obfuscated | Real Name | Purpose |
|------------|-----------|---------|
| `kl` | C2Client | HTTP C2 hub — `java.net.http.HttpClient` + Gson |
| `iw` | RestApiClient | Async REST — license validation, command fetch |
| `yp` | WebSocketClient | Raw NIO WebSocket for real-time C2 |
| `swb` | ConnectionHandler | Frame-level connection management |
| `sw` | SystemInfo | Fingerprints the machine (OS, user, HWID, hardware) |

The C2 uses **dual-channel communication**: REST for requests/responses (license check, config fetch, data exfil) and WebSocket for real-time bidirectional commands. The WebSocket implementation is hand-rolled RFC 6455 using `java.nio.channels.SelectionKey` — not a library.

## Custom Crypto Stack (6 classes)

| Class | Purpose |
|-------|---------|
| `lj` | Block cipher engine — encrypt/decrypt with multi-buffer support |
| `ni` | High-level crypto API — `ceq(mode, data...)` |
| `ha` | Cipher mode enum — 8 different modes |
| `kj` | Key schedule — 436KB compiled key expansion function |
| `tz` | Cipher state container |
| `e` | Hash/transform utility |

The key expansion function (`JNT_kj_cca`) compiles to 436KB. Standard AES-256 key schedule would be ~2KB compiled. This is either a custom cipher or heavily inlined.

## Cheat Modules (20+)

Full-featured client with: KillAura, AimBot, ESP, Freecam, SpeedHack, Scaffold, Reach, Timer, AntiBot, HitboxModifier, AutoReconnect, InventoryManager, BlockESP, EntityTracker, and more. Complete GUI system with settings screens, color picker, keybind editor.

All module logic is native — the Java side only declares `native` methods.

# String Decryption

This was the main challenge. Every string is encrypted, and without decrypting them we can't find:
- C2 server URLs
- What data the RAT steals
- Command protocol details
- API endpoints

## The Native Decoder: `jnt_decode_string`

The native binary exports a 5,454-byte function for string decryption:

```c
void jnt_decode_string(uint16_t* buffer, int length, int key);
```

It operates in-place on a UTF-16 buffer. The `key` parameter (0-16) selects one of 17 different transformation chains via a jump table at `0x18796c` in `.rodata`.

Each chain applies a series of reversible bit operations:
- Shifts: `shl`, `shr`, `sar`
- Masks: `and 0x3ff`, `and 0x1fff`, `and 0x3fff`, `and 0x1ffe`
- XOR with constants: `xor $0x75`, `xor $0x6c00000000`
- Addition/subtraction with large constants
- IEEE 754 float-component packing using masks like `0x7fff00000000`, `0x7ff00000000`

The `pow()` glibc import is literally for the string decryptor — they encode character values as IEEE 754 double-precision float components.

### Verification with Unicorn Engine

We used the Unicorn CPU emulator to run the native x86_64 code on our aarch64 machine:

```python
from unicorn import *
from unicorn.x86_const import *

# Load the ELF into Unicorn's memory
mu = Uc(UC_ARCH_X86, UC_MODE_64)
# ... map ELF segments ...

# Call jnt_decode_string(buffer, length, key=16)
test_chars = [0x905a, 0x50a1, 0x90a3, 0x90a3, 0xd0a2]
result = decode_string(mu, test_chars, 16)
# Result: "Hello" ✓
```

The native decoder works — but it only handles strings decoded at the native level.

## The Java Bootstrap Decoder

The majority of strings are decoded by Java bootstrap methods, not the native function. Each class has a bootstrap method named `"0"` or `"1"` that handles `InvokeDynamic` resolution:

```
InvokeDynamic #0:JNT:()Ljava/lang/Object;
```

Bootstrap args: `[int, encrypted_class, encrypted_method, encrypted_descriptor, int]`

The bootstrap decrypts the three strings (class name, method name, type descriptor) using bitwise operations on each character, then calls `MethodHandles.Lookup.findStatic/findVirtual/findConstructor` with the decrypted names.

The problem: the bootstrap methods are **heavily obfuscated with goto-spaghetti**. A typical bootstrap has ~650 instructions with **243 goto jumps** and **240 unique jump targets**. Every instruction jumps somewhere else. Linear disassembly is meaningless.

### Building a JVM Interpreter

Since we couldn't run the native library on our platform (aarch64 Linux — no native binary exists for it), we built a **Python-based Java bytecode interpreter** that:

1. Parses the `.class` file constant pool, methods, and bootstrap method table
2. Interprets every Java bytecode: stack operations, arithmetic, bitwise ops, control flow (including the goto spaghetti), method invocations
3. Simulates `StringBuilder.append(char)` to capture decoded characters
4. Intercepts `MethodHandles.Lookup.findStatic/findVirtual` calls to capture the final decoded class name, method name, and descriptor
5. Runs against all 979 bootstrap entries across all 338 class files

The interpreter is ~1,700 lines of Python. It handles 50+ JVM opcodes, simulates object references, and follows the goto spaghetti through every jump.

```python
# Simplified core loop
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

Running it against all classes produced decoded strings for every encrypted reference in the client.

# The Deobfuscated Architecture

With all strings decrypted, we produced a complete deobfuscated source reconstruction: **37 Java files, 3,064 lines**, with full class/method/field mappings from obfuscated to readable names. The complete class mapping covers:

- 7 core framework classes
- 6 crypto classes
- 6 network/C2 classes
- 20+ cheat module classes
- 10+ event types
- 6 setting types
- GUI screens, render utilities, and more

The reconstruction is a compilable Fabric mod project with Gradle build files, complete with Javadoc comments mapping every field and method back to its obfuscated name.

# The Irony

They built:
- A custom Java-to-native transpiler (JNT3) using Zig
- Cross-platform native binaries for 4 architectures
- A custom cryptographic stack with 8 cipher modes
- IEEE 754 float-component string encryption
- Goto-spaghetti bytecode obfuscation with 240+ jump targets per method
- Anti-decompiler tricks that crash CFR and Procyon
- A full cheat client with 20+ modules and custom rendering

And then they left the license key in a plaintext file called `licenseKey`.

# Takeaways

1. **JNI obfuscation is effective but not impenetrable.** Moving logic to native code raises the bar significantly, but the JNI bridge itself leaks information — method signatures, field types, and the reflection API calls reveal the architecture.

2. **String encryption is only as strong as its weakest link.** The native decoder was solid, but the Java bootstrap had to exist in interpretable bytecodes. Goto spaghetti makes it hard but not impossible — a bytecode interpreter cuts through it.

3. **Cross-platform malware has coverage gaps.** Four native binaries covered x86_64 Linux/Windows/macOS and aarch64 macOS. Our aarch64 Linux machine was literally immune — the rat had no payload for our platform.

4. **Static analysis scales with tooling.** Unicorn for native emulation, a custom JVM interpreter for bytecode, parallel analysis agents for classification — the right tools make even heavily obfuscated malware tractable.

5. **Always check the mod list.** If "BetterF3" is loading native JNI libraries, something has gone very wrong.

---

*Analysis performed by the idktheflag team. Tools used: Recaf 4.x, javap, readelf, objdump, Python, Unicorn Engine.*
