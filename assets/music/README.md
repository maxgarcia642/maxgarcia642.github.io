# Background music

## Playlist (v4)
The player reads its rotation from `content.json → music.tracks` — an array of
`{ "src", "title", "artist" }`. One track loops; two or more advance in order
and the ⏭ dock button appears automatically. To add a track:

1. Drop the file in this folder (e.g. `track2.mp3` — any browser-decodable
   audio format works: mp3, m4a/aac, ogg, opus, flac, wav).
2. Add its entry to `content.json → music.tracks`.

Visitor uploads (🎧) join the rotation as local object URLs — they are never
uploaded anywhere and vanish on refresh.

## Autoplay honesty
`music.autoplay: true` means the player *attempts* to start on arrival and
otherwise starts on the visitor's first click or keypress. Chrome, Safari, and
Firefox all block audible autoplay before an interaction — that's a browser
policy no site can override, so "on entry" here means "the first instant the
browser allows."

## ⚑ Licensing flag (recorded 2026-07-16, unchanged)
`track1.mp3` is AIR — "Ce matin-là" (Moon Safari), a commercial recording
shipped at Max's explicit, documented decision. Public hosting of a commercial
track is a DMCA takedown risk; the honest fix remains a licensed or
royalty-free replacement (see the scout brief's audio category). This flag is
documentation, not permission — the risk call is the owner's.
