# Background music

`script.js` plays `assets/music/track1.mp3` on a loop; the ♫ dock button
mutes/unmutes and the 🎧 button lets a visitor play a local file of their own
(object URL — it never leaves their browser).

## What ships here now

`track1.mp3` = **AIR — "Ce matin-là" (Moon Safari, 1998)**, added 2026-07-16
at Max's explicit direction.

> ⚑ **Licensing honesty flag:** this is a commercial recording (Source/EMI).
> Publicly serving it as site background music is *not* covered by any
> royalty-free license and carries takedown/DMCA risk. The site owner accepted
> that risk knowingly; this note exists so nobody mistakes it for a cleared
> track. Swap in a royalty-free loop (Pixabay Music, Free Music Archive,
> incompetech) to close the flag.

## Behavior

1. **Loop starts on the visitor's first interaction** (click/keypress) —
   true autoplay is blocked by every modern browser. If the visitor muted it
   on a past visit, it stays muted (localStorage `mg-music`).
2. **Format:** MP3 (universal). Keep loops compressed; seamless loop points
   avoid clicks.
3. **Custom track:** the 🎧 button swaps the source for the current visit
   only — nothing is uploaded or stored.
