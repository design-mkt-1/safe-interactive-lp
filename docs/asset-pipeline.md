# Asset pipeline — vault footage

How the two video clips in `assets/video/` are produced. The files currently
committed are flat-colour placeholders; this document is how the real ones get
made.

## Structure

Two clips, not a single cut:

1. **Idle loop** — the closed vault, red neon breathing. Loops indefinitely
   while the page waits for the visitor.
2. **Opening** — 4 seconds: bolts retract, the door swings open, the gold is
   revealed. Plays once on a completed hold, then **holds on its last frame**
   for the rest of the visit. Only a reload returns to idle.

The scan feedback deliberately lives in HTML, not in the footage: the progress
outline traces the scanner plate while the visitor holds. That frees the whole
4 seconds of the opening clip for the mechanical reveal, which is the part
worth watching, and it keeps the interaction responsive to a partial hold.

## Decisions

1. **No text in the video.** Ever. Every word on screen is HTML, which keeps
   the footage reusable across locales and campaigns and keeps typography
   crisp rather than AI-rendered.
2. **Two clips, not three.** An earlier plan split unlock and open; merging
   them removes a crossfade and a failure point.
3. **The opening clip must come to rest.** If the camera is still moving on
   the last frame, the freeze reads as a stall rather than an arrival.
4. **Mobile 9:16 is primary.** Desktop 16:9 is a second pass.

## Approved frames

Generated with Higgsfield. Job IDs, in sequence:

| Frame | Job ID     | State                                            |
| ----- | ---------- | ------------------------------------------------ |
| ①     | `56dd003a` | Closed vault, red neon horseshoe ring            |
| ②     | `d01dd830` | Cracked open, gold seam escaping (intermediate)  |
| ③     | *approved* | Fully open, gold bullion spilling over threshold |

Frame ③ was produced image-to-image from an earlier open-vault render, adding
the ingot pile while holding the door, ring, smoke and floor reflection fixed.

> **Model substitution:** Higgsfield's MCP has served `nano_banana_2` for
> explicit `nano_banana_pro` requests, and `nano_banana_flash` for
> image-to-image calls. Check the `model` field in the response rather than
> assuming the requested tier.

Note the media role for image-to-image is `image`, despite the catalogue
advertising `image_references` for these models.

## Clip prompts (Kling 3.0)

Use **start + end frames** where the tool supports them — it pins each clip at
both ends so it cannot drift. With a start image, describe only how the scene
**evolves**; re-describing what the frame already shows causes drift.

### Clip 1 — idle loop

`start: ①` · `end: ①` (the same frame) · 5s · 9:16 · audio off

Using the same frame at both ends makes the loop close on itself. A pulsing
neon ring is inherently cyclic — it returns to the intensity it started at —
so the content suits this naturally.

```
Locked-off static camera. No camera movement whatsoever, no push in, no drift,
no zoom, no parallax. The framing is identical in the first and last frame.

The shot is a single seamless cycle that ends exactly as it began. The red neon
ring completes precisely one full pulse: it brightens smoothly to a full glow
around the middle of the shot, then eases back down and settles at exactly the
same intensity it started at. The square scanner plate at the centre of the
door breathes once in and out in the same rhythm, its four corner brackets
glinting at the peak. Fine dust motes drift lazily and continuously through the
red light. The thin haze near the floor shifts almost imperceptibly. The red
reflection on the polished floor swells and fades with the ring.

Every part of the vault stays absolutely motionless throughout: the door does
not move, the bolts do not move, the wheel does not turn, the hinges do not
shift. Nothing opens, nothing changes state.

Extremely subtle, quiet, restrained, hypnotic. One continuous shot, no cuts,
designed to loop perfectly.
```

The locked-off camera is what lets this loop invisibly.

Kling treats `end_image` as a destination it steers toward, not a pixel-exact
target, so expect it to land close rather than perfect. If a seam remains,
crossfade the tail into the head:

```bash
ffmpeg -i idle-raw.mp4 -filter_complex \
  "[0]split[a][b];[a]trim=0:4.7,setpts=PTS-STARTPTS[main];\
   [b]trim=4.7:5,setpts=PTS-STARTPTS[tail];\
   [main][tail]xfade=transition=fade:duration=0.3:offset=4.4" \
  -c:v libx264 -crf 23 -pix_fmt yuv420p -an vault-idle-9x16.mp4
```

Prefer this over a boomerang: reversing the clip runs dust and smoke backwards
for half the loop, which reads as subtly wrong even when it is hard to name.

### Clip 2 — opening

`start: ①` · `end: ③` · 4s · 9:16 · audio off

```
The heavy locking bolts retract out of the rim and back into the door body in
rapid mechanical sequence around the circumference, and the central wheel
spins a quarter turn.

The colossal circular door then swings outward to the left, its full depth and
radial bolt array rotating into profile view. Brilliant golden light floods out
of the vault interior, blooming into thick volumetric god rays. A pile of gold
bullion ingots is revealed inside, bars catching the light with brilliant
specular highlights and spilling forward over the threshold. Heavy smoke rolls
out across the polished floor toward the camera. The red neon ring rim-lights
the outer edge of the swinging door, and the floor reflection blooms from red
into a pool of gold.

The camera pushes in slowly and steadily, easing to a complete stop in the
final second so the shot settles into stillness and comes fully to rest.

One continuous shot, no cuts.

No text, no captions, no subtitles, no watermarks, no UI overlays.
```

Frame ② is not used for a clip. It exists only as a pose reference if the
opening needs to be split or re-timed.

## Post-processing

```bash
# transcode for web
ffmpeg -i raw.mp4 -c:v libx264 -crf 23 -pix_fmt yuv420p \
       -movflags +faststart -an vault-open-9x16.mp4

# VP9 fallback — Chromium builds without proprietary codecs cannot decode H.264
ffmpeg -i vault-open-9x16.mp4 -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 \
       -pix_fmt yuv420p -an vault-open-9x16.webm

# seamless idle loop (forward + reversed, so the loop point is invisible)
ffmpeg -i idle-raw.mp4 -filter_complex \
  "[0]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1" \
  -c:v libx264 -crf 23 -pix_fmt yuv420p -an vault-idle-9x16.mp4

# posters
ffmpeg -i vault-idle-9x16.mp4 -frames:v 1 -q:v 3 poster-idle.jpg
ffmpeg -sseof -0.1 -i vault-open-9x16.mp4 -update 1 -frames:v 1 -q:v 3 poster-open.jpg
```

Strip audio (`-an`) — the page is muted and an audio track can block autoplay
on iOS. Target under ~1.5 MB per clip.

`poster-open.jpg` is not decorative: it backs the frozen final frame, because
browsers sometimes drop the last decoded frame of a paused video.

## After the clips land

1. Drop them into `assets/video/` under the existing filenames.
2. Re-check `--scan-x` / `--scan-y` in `assets/css/style.css` against the real
   footage so the hold target sits on the scanner plate.
3. Screenshot every state at 390px and 1440px to confirm the transitions.

## Environment note

Higgsfield serves assets from `d8j0ntlcm91z4.cloudfront.net`. A cloud session
can only download them if the environment's network access is **Custom** with
`*.cloudfront.net` in the allowed domains **and** "Also include default list of
common package managers" ticked. Network policy binds at session start, so
changing it requires a new session.

A setup script of `apt update && apt install -y ffmpeg || true` is worth having
on that environment — ffmpeg is needed throughout this pipeline and is not
pre-installed.
