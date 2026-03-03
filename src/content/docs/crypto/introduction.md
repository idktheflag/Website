---
title: Introduction to Crypto
description: Cryptography basics for CTF challenges
---

## What is CTF Crypto?

Hey guys, Qu1ck5h0t here. I'm one of the crypto guys on the team, and I just so happen to be a founder/captain. I'm gonna walk you guys through the basics of CTF cryptography without the [clanker slop](https://i.ibb.co/S4m2QVcB/image.png) (we have an unapologetically robophobic culture here at idk). 

Here's a secret they don't tell you: fundamentally, it's just maths. If you can read maths and read code, you're golden. But if you're here, chances are you can't read maths. That's fine, because that's what I'm sacrificing my precious 1am time for instead of doing my chemistry coursework. But first, some yapping.

## Why do CTF crypto?
Great question, because I've been asking myself this as well. Sure, most websites report the salary of a cryptographer to be somewhere between $100-200k USD, and although chances are you end up somewhere else in cyber, your crypto skills will come in use anywhere you go. So why do I do crypto? Because it makes my brain big! No, seriously, some say crypto is the hardest part of CTF and an argument I'd make in favour of that stance is that it's the only CTF category that links maths and programming to real world attacks, or in other words you got a 3 in 1! Still not convinced? It's really high demand since everybody wants to do web or forensics or rev. In fact, hard crypto challs are some of the hardest challs to AI solve, so you get to keep your job (as of 2026). Congratulations, you're now an endangered species!

Ok now onto an overview of the cool stuff you'll be doing.

## There's no way I can reasonably list everything you need to know on a single page, so here are the categories of the stuff we'll go through

- Ciphers (very ez stuff, cyberchef + dcode.fr == flag. Chall devs think pigpen and morse are slick, they ain't)
  
- RSA Challs (either very very ez or your posterior will hurt a lot next morning)
  
- Block Ciphers (remember kids, you can't break AES but they'll ALWAYS wrongly configure it. Or try to make their own. Don't worry about that, because you'll either be able to solve it with common sense or fail)
  
- Hash Functions (SHA-256 shouldn't be crackable but wordlists will help you solve the easy challs. Good luck on solving the collision ones tho)
  
- ECC (HAHA, the clanker who was here before me forgot this one! And for good reason, because this stuff is pretty tough)

- PRNG (if it doesn't say CSPRNG, it can be broken. If it says CSPRNG and you see it in a chall, it's not CSPRNG. Don't know what those mean? Don't worry, keep reading)

- Lattice attacks (this is the stuff I'm worst at, but rest assured I'll get good enough at it to teach you. Fun fact: the NIST's first post-quantum encryption standard works on that stuff, neat innit?)

- Blockchain (actually I've seen people list this as its own category, and most blockchain challs are just smart contract exploits. I'll run ya through the crypto aspects of it though, to give you an idea of what's under the hood)

- Steganography (again, mostly a separate category but sometimes there's a lot of maths in it and that's where I'd claim a territory dispute)
  

<br></br>
Lastly, do [PicoGym](https://play.picoctf.org/practice) and [Cryptohack](https://cryptohack.org/) along with whatever I write here. No, don't go running off *now*, I just caught your attention :(

But seriously, those things help a lot. But more importantly, do real CTF challs in live CTFs. That's how you actually get gud.
