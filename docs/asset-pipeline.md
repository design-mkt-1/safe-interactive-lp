# Asset pipeline — vault footage

How the three video clips in `assets/video/` are produced. The files currently
committed are flat-colour placeholders; this document is how the real ones get
made.

## Reference

The concept comes from a 10s reference video (1280×720, 24fps) supplied by the
client. Beat map:

| Time     | Beat                                                                |
| -------- | ------------------------------------------------------------------- |
| 0–2.5s   | Closed vault, neon ring, fingerprint scanner, "hold to scan"        |
| 2.5–4.0s | Laser sweeps the fingerprint plate                                  |
| 4.0–5.0s | "Access granted", bolts retract                                     |
| 5.0–7.0s | Door swings open, golden light and volumetric smoke flood out       |
| 7.0–8.5s | Bonus reveal + device-lock countdown                                |
| 8.5–10s  | Camera tilts down, registration form rises                          |

The Topbet version is red rather than the reference's cyan, and **carries no
text at all** — every word on screen is HTML. That keeps the footage reusable
across campaigns and locales, and keeps typography crisp instead of
AI-rendered.

## Decisions

1. **No text in the video.** Ever. See above.
2. **Generic reveal** — gold light with clean negative space in the middle,
   which is where the HTML offer card lands.
3. **Three interaction-driven clips**, not one continuous cut, so the page can
   genuinely wait on the user in the idle state.
4. **Frame chaining.** Higgsfield's `kling3_0_turbo` accepts a start frame
   only — it has no end-frame input. So continuity comes from extracting each
   rendered clip's true last frame and feeding it to the next generation.
   (Krea's `kling/kling-3.0` does support `start_image` + `end_image` if that
   route is preferred.)
5. **Mobile 9:16 is primary.** Desktop 16:9 is a second pass.

## Stage 1 — hero frames (Nano Banana Pro, 2K, 9:16)

Three frames, generated for visual approval and to anchor the clips.

> **Note:** Higgsfield's MCP has been observed serving `nano_banana_2` for
> explicit `nano_banana_pro` requests. Check the `model` field in the response.

### Shared style spine

Appended to every frame prompt. The no-text clause is emphatic because image
models reliably invent signage otherwise.

```
Photorealistic cinematic 3D product render, Octane and Redshift quality,
ray-traced reflections, volumetric haze and floating dust motes, shallow depth
of field, dramatic chiaroscuro lighting, ultra-detailed metal microsurface,
subtle film grain, 8K.

Absolutely no text, no typography, no letters, no numbers, no words, no
signage, no labels, no UI elements, no logos, no watermarks anywhere in the
image.
```

### Composition rule

The vault occupies the upper ~60% of the vertical frame. The lower ~40% stays
dark and uncluttered — that is where the registration card sits on mobile.

### Colour direction

```
The scene is lit almost entirely in one signature brand red: a hot vermilion
scarlet, hex #D91C05, orange-leaning rather than pink or crimson. This exact
red appears as: a brilliant neon ring tracing the full circumference of the
circular door; a recessed biometric scanner plate glowing at the exact centre
of the door, framed by four thin corner brackets; thin red emergency strip
lighting running vertically down the wall panels on both sides; red-anodized
metal accents on the rotary wheel handle and on the heads of the locking
bolts; and a long soft vermilion reflection stretching across the polished
black floor. Everything else is near-black and gunmetal so the red reads as
the only colour in the frame.
```

### Frame 1 — `vault-closed`

```
A colossal circular bank vault door set into a square gunmetal steel frame,
centered in a dark underground vault antechamber. Walls of charcoal-black
brushed steel panels with deep vertical seams. The door is blue-black hardened
steel with heavy rivets, radial spoke bars, a chunky central rotary wheel
handle, and a massive hinge column on the left side. Deep black shadows, thin
atmospheric fog drifting near the floor.
```

### Frame 2 — `vault-cracked`

Generate as image-to-image from the approved Frame 1 so the set matches.

```
The same vault door in the same dark antechamber, same camera angle. The heavy
locking bolts have retracted from the rim into the door body. The central
rotary wheel has rotated a quarter turn. The door has cracked open by a few
degrees along its left edge, and a razor-thin blade of blindingly warm golden
light escapes from the seam, cutting across the dark floor. The red neon ring
now burns white-hot at full intensity. Thin wisps of smoke begin curling out
of the gap near the base. Red and gold light mix on the steel.
```

### Frame 3 — `vault-open`

```
The same vault in the same dark antechamber. The colossal circular door now
stands fully swung open toward the left, its enormous depth and the full
radial array of locking bolts turned into view in profile. Brilliant golden
light floods out of the open vault interior in thick volumetric god rays.
Inside, rows of polished brass safety deposit box fronts glow warm gold and
fall away into soft focus. Heavy smoke rolls forward out of the vault and
spills across the polished black floor toward the camera. The red neon ring
rim-lights the outer edge of the open door.

The center of the glowing vault interior is deliberately clean, open and
empty — no objects, no contents, no text — pure luminous golden negative
space.
```

That last paragraph is load-bearing: the HTML reveal card lands in exactly
that space.

## Stage 2 — clips (Kling 3.0 Turbo, 1080p, 9:16)

With a start image, describe only how the scene **evolves**. Re-describing
what the frame already shows causes drift.

### Clip A — `idle` (start = Frame 1, 5s)

```
Locked-off static camera, no camera movement whatsoever. The crimson neon ring
pulses slowly — brightening to a full glow and easing back down once over the
shot. The red scanner plate at the center breathes faintly in and out of
intensity. Fine dust motes drift lazily through the red light. The thin floor
fog shifts almost imperceptibly. Every piece of the vault door, every bolt,
wheel and hinge stays absolutely motionless. Extremely subtle, quiet,
restrained. One continuous shot, no cuts.
```

### Clip B — `unlock` (start = Frame 1, 5s)

```
A thin horizontal band of red light sweeps slowly down across the central
scanner plate, then back up. The neon ring flares white-hot and a bright pulse
races once all the way around the circle. Heavy locking bolts retract from the
rim into the door body in rapid mechanical sequence, one after another around
the circumference. The central rotary wheel spins a quarter turn. The door
shudders and cracks open a few degrees along its edge, releasing a razor-thin
blade of blinding warm golden light from the seam. Wisps of smoke start
curling out from the base of the gap. The camera pushes in very slowly and
steadily. One continuous shot, no cuts.
```

Frame 2 exists to verify Clip B lands on the right pose. If the render drifts
from it, the render wins — it becomes Clip C's start.

### Clip C — `open` (start = extracted last frame of the approved Clip B, 5s)

```
The colossal circular door swings outward toward the left, its full depth and
radial bolt array rotating into profile view. Brilliant golden light floods
out of the vault interior, blooming into thick volumetric god rays. Heavy
smoke rolls forward out of the opening and spills across the polished floor
toward the camera. The camera pushes in slowly and steadily toward the open
doorway, easing to a gentle stop as the glowing interior fills the frame and
settles. One continuous shot, no cuts.
```

## Stage 3 — post

See the encoding commands in the root `README.md`. In short: boomerang the
idle clip for a seamless loop, encode H.264 MP4 + VP9 WebM, strip audio,
extract posters, keep each clip under ~1.5 MB.

## Checkpoints

Each step is approved before the next spends credits, because chaining means a
bad Clip B poisons Clip C.

1. Frame 1 → approve the look
2. Frames 2 and 3, generated from Frame 1 as references → approve
3. Clip A idle loop → approve
4. Clip B unlock → approve
5. Clip C open → approve
6. Drop into `assets/video/`, tune `--scan-x` / `--scan-y` → approve
7. Desktop 16:9 set

## Environment note

Higgsfield serves assets from `d8j0ntlcm91z4.cloudfront.net`. A cloud session
can only download them if the environment's network access is **Custom** with
`*.cloudfront.net` in the allowed domains **and** "Also include default list of
common package managers" ticked. Network policy binds at session start, so
changing it requires a new session.

A setup script of `apt update && apt install -y ffmpeg || true` is worth having
on that environment — ffmpeg is needed throughout this pipeline and is not
pre-installed.
