# Background music slot

`script.js` looks for `assets/music/track1.mp3`. Nothing ships here on purpose:

1. **Licensing is real.** Embedding a commercial track you don't have a sync
   license for is infringement even on a personal site. Use royalty-free /
   CC-licensed tracks (Pixabay Music, Free Music Archive, incompetech, etc.)
   and honor attribution terms.
2. **Format:** MP3 (universal). Keep loops short and compressed; seamless loop
   points avoid clicks. Add an OGG `<source>` in index.html if you want a
   smaller alternate.
3. **Behavior already handled:** never autoplays (browser policy — Chrome,
   Safari, and Firefox all block audible autoplay), unlocks on first click of
   the ♪ button in the dock, preference remembered in localStorage, single
   persistent element so theme switches don't restart the track.

Drop your file in as `track1.mp3` and the ♪ button goes live. No code changes.
