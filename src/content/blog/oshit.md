---
title: 'osint: oshit'
description: 'smartfella ctf fr'
pubDate: '2026-05-31'
author: ['riverxia', 'n1m5n', 'ch1v4lry']
---
# the best osint ive ever seen (facts)

i say! hey! hey! hey! hey! start dash!

start`https://x.com/mrfellasmart`
tweet where first letter of each word - next lead (reddit username)

`https://www.reddit.com/user/nikolai_tankman/`->reddit profile bio has a yt channel id

`https://www.youtube.com/channel/UCzLAwam-FUPAnNyX6cLcPdQ`
in the video transcript, a hidden pastbin link, encoded:

71etnufhx/h/zbp.avorgfnc//:fcggu

decode: Reverse the string, then apply ROT13:

```
reverse → https://pastebin.com/h/xhfunte17  (not quite)
reverse → sptth://pastebin.com/h/xfun17e... 
→ https://pastebin.com/u/kushagr17
```

pastebin: user kushagr17
pfp has the string `/PQrLnkV8` which is a pastebin path->
brainfuck
```
++++++++++[>+>+++>+++++++>++++++++++<<<<-]>>>>+++++++++....+++++++++.-----------------.+++++++++++++.+++++++.<+++++++++++++.++++++++++++++++++.--.>----.---.<++.-.>--.<---.>+++..++++.--------.+++.<+++.<++++++++++++++++++++++++.+.
```
when run->`mmmmverySecuredpassword67`
One of the pastes (`https://pastebin.com/Zw4jfeCr`) 
unlocks with that 
```
 𒁙𓁵𓈠𓅡慫𓄠陨ꍬ𖤠𓍯頠𒁨𓅯啥𒁴阠顣𒅥啴𓉩售鹆饮ꔠ𓅩陴驨鹮驭慭縠鴠陥饲鴠啥驲马𓅡饥𓄠ꕯ啥院鱮𓁥捳褠鹨啳驭𓅳鱡啥鹷ꍬ𓈠𓁥鹭陮驴鸠啮唵驳𒁣饮捳
```
base 65536->
```
Your task, shall you choose to accept it. Find mistahenimem, I heard he released some bangers. This message will terminate in 5 seconds.
```
https://soundcloud.com/mistahenimem

click on track->desc
```
tavgebcchf lygangfabp sb qrevg fv rfyr rablerir ryvuJ
tavgebcre gv yynp qan gutvsaht n bg nerznp n taveo hbL
qrupgnzghb lyrgryczbp re'hbl reruj rznt n av xpvxrqvf n gfhW
qrehgcnp tavggrt flnjyn gho fcbbpf tavfnup erufvuC naryR
```
rot13 & reverse
```
Elena Phisher chasing scoops but always getting captured
Just a sidekick in a game where you're completely outmatched
You bring a camera to a gunfight and call it reporting
While everyone else is tired of constantly supporting
```
uncharted reference! crazy

instagram: `https://www.instagram.com/elenaphisher`
spelled phisher instead of fisher (same as in decode)

u actually need an insta account for this part

```
#9EEADi^^5@4D]8@@8=6]4@>^5@4F>6?E^5^`|'JFp6b;z6<J`~<|(~6'3_}p'$x(5!dDG~c\I<GEA!D^65:EnFDAlD92C:?8
```

comment on one of the insta posts is that

rot47:
`Rhttps://docs.google.com/document/d/1MVyuAe3jKeky1OkMWOeVb0NAVSIWdP5svO4-xkvtpPs/edit?usp=sharing`
google doc actually has hidden text but we found it in an unintended way when someone posted the link to our team discord it showed up like this:
```
Google Docs
dokument
🤪🤪🤪🤪🤪🤪🤪🤪 2D38aqPVp1T3Fx6g42pRhpXjdMMKFhuGXHCcBb5 🤪🤪🤪🤪 🤪🤪🤪🤪 🤪🤪🤪🤪 🤪🤪🤪🤪 🤪🤪🤪🤪 V2FpdCB5b3UgZm91bmQgdGhpcyBmcj8=
```
cyberchef autodetects as base58
```
uggcf://qvfpbeq.tt/cls2PJ9MH
```
rot13 again
`https://discord.gg/pyf2CW9ZU`
description of channel #cool-cats
`it2ru6.png` hidden between `||`'s
cats->catbox.moe
https://files.catbox.moe/it2ru6.png


easy geoguess on chivalry's part
https://www.google.com/maps/place/43°03'41.5"N+131°54'20.2"E/@43.0465363,131.8868546,3a,75y,48.88h,78.86t/data=!3m8!1e1!3m6!1sCIHM0ogKEICAgIDymMaEtQE!2e10!3e11!6shttps:%2F%2Flh3.googleusercontent.com%2Fgpms-cs-s%2FABJJf52CPLxmWX-5Rc8aYucDEMmZq9V9MSMDZP-1jL0k5oSIF5PUQ17km1_Nk9ifEQ0IRt9B_ad57nCWRFB6yLbdfqUWLn3mekxyAhmLrBi4DjkulgsPZ7K22wJcONPM8fK_QzGlPA9gFw%3Dw900-h600-k-no-pi11.135501475168667-ya48.884412114848246-ro0-fo100!7i4096!8i2048!4m4!3m3!8m2!3d43.061528!4d131.905611?entry=ttu&g_ep=EgoyMDI2MDUyNy4wIKXMDSoASAFQAw%3D%3D\
or maybe it was pongo i dont remember

taokyle post!
https://maps.app.goo.gl/Nkegm7jK8pCaRHfZA

(in chinese)

epic quickshot quote on the original chinese:
```
Qu1ck5h0t [idk], 
 — 5/29/26, 5:11 PM
WTF
this is like
really really old chinese
```

chinese and english translation:
```
Although I haven't personally visited this place, based on their capture-the-flag competition, I secretly believe that the Russian gas station is enough to make me cross the border. And indeed it is. The pumps storing the gas and oil are truly aptly named, and the taste is extremely sweet. Moreover, the liquefied petroleum gas stored in Chloe's freezer also made me feel exhilarated, as if millions of treasures were entering my stomach. After leaving this message, I felt like gagging, because my stomach was rumbling like a V12 engine. I also felt that this freezer was truly powerful, with an internal temperature of nearly twenty Kelvin, which made me gasp in amazement and admiration, and I firmly believed that there must be a flag inside, the very essence of the octopus cat's nexus.
雖未親至斯地，然以他們奪旗賽之由，竊以為羅剎國之加油站，誠足使余越境而往。事亦誠然。其所貯氣油之泵，名副其實，味極甘美。況克洛伊冰櫃中冷藏液態石油氣，亦使我心曠神怡，恍若數百萬財寶入我腹中。吾或留言既畢，將欲乾嘔，蓋胃中轟鳴，如V十二引擎。又覺此冰櫃實為強大，內溫幾近二十開爾文，使我咋舌，驚歎崇敬，深信其中必有旗幟，冷藏於章魚貓之樞紐之旨焉。
```

legendary acni pull:
https://github.com/chloefreezer/whatisguthib

go into commit history, see: `227a927e3fc04ce3959a6031d1d5a01f` in one of the past commits
this is a gist id, which my team knew from me giving them a gist chall in our in-house ctf and torturing naman with it

(relevant commit: https://github.com/chloefreezer/whatisguthib/commit/ece6e12bd23a1c07b56641ff0be1693c173f4221)

`https://gist.github.com/chloefreezer/227a927e3fc04ce3959a6031d1d5a01f`

from base85, it's a wav file (morse code)
morse decrypt: `TOOK YOUR SWEET TIME EH? CHECK OUT THIS DIRTY PRANK I PLAYED OUT WITH NATE XD. HE GOES BY NATHAN BRAKE ON THE INTERNET. HAVE FUN`


epic commentary:
```
ch1v4lry [GGWP], 
 — 5/29/26, 5:18 PM
longest chall oat
Andyrew
 — 5/29/26, 5:18 PM
holy shit 😭😭😭
Zemi [ٴٴ],  — 5/29/26, 5:18 PM
lmao
Naman [idk],  — 5/29/26, 5:18 PM
i love osint 🫩
```

a second legendary acni pull
`https://bsky.app/profile/nathanbrake.bsky.social`
one of the posts has `kt0hur3oyig1a27nyc` sticking out
it took us a while to figure it out
first we thought crypto (bc ncl suckz), then telegram (we were running out of ideas)
then i thought "character.ai" (dont ask why i thought that)
https://character.ai/chat/kt0hur3oyig1a27nyc

yeah that didn't work but it was on the right track, it made us THINK of ais

then deepseek...
https://chat.deepseek.com/share/kt0hur3oyig1a27nyc

yeah it was deepseek all along who would have thought

`THEM?!CTF{unch4rt3d_r3f3r3nc35_1n_4n_051nt_ch4ll3ng3_c0z_why_n0t_xD?!_congratulations}`

