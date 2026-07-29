# Topbet — Interactive Vault Landing Page

A mobile-first landing page built around a hold-to-scan vault interaction:
the visitor presses and holds a biometric scanner, the vault unlocks, swings
open, and reveals the welcome bonus above a registration form.

Static HTML/CSS/vanilla JS. No build step, no dependencies.

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Interaction flow

| State       | Video               | Overlay                                          |
| ----------- | ------------------- | ------------------------------------------------ |
| `idle`      | idle clip, looping  | Headline + pulsing hold-to-scan target           |
| `scanning`  | idle clip continues | Plate outline fills over 1.6s; release resets it |
| `unlocking` | opening clip        | "Access granted" badge, clears before the reveal |
| `revealing` | opening clip frozen | Offer + 15-minute reservation countdown          |
| `register`  | frozen final frame  | Registration card                                |

State lives in `data-state` on `<html>`, so CSS drives all visibility.

## Video assets

> **The clips currently in `assets/video/` are flat-colour placeholders.**
> They exist so the interaction can be developed and tested. Replace them
> with the real renders — same filenames, no code change needed.

Two clips only. The idle loop runs until the visitor completes the hold; the
opening clip then plays once and holds on its final frame for the rest of the
visit. Only a reload returns to the idle state.

```
assets/video/
  vault-idle-9x16.mp4      seamless loop, closed vault, red neon breathing
  vault-open-9x16.mp4      bolts retract, door swings open, gold ingots revealed
  vault-{...}-16x9.mp4     desktop cuts of the same two clips
assets/img/
  poster-idle.jpg          first frame of the idle clip
  poster-open.jpg          last frame of the opening clip — the resting state
```

The opening clip must come to rest on its last frame. If the camera is still
moving when it ends, the freeze reads as a stall rather than an arrival.

`app.js` picks portrait or landscape sources at runtime via `matchMedia`
(`<source media>` inside `<video>` is not reliably honoured across browsers).

### Encoding the real renders

```bash
# transcode for web
ffmpeg -i raw.mp4 -c:v libx264 -crf 23 -pix_fmt yuv420p \
       -movflags +faststart -an vault-open-9x16.mp4

# the idle clip is generated with the same start and end frame so it already
# loops; see docs/asset-pipeline.md for the crossfade fix if a seam remains

# posters
ffmpeg -i vault-idle-9x16.mp4 -frames:v 1 -q:v 3 poster-idle.jpg
ffmpeg -sseof -0.1 -i vault-open-9x16.mp4 -update 1 -frames:v 1 -q:v 3 poster-open.jpg
```

Strip audio (`-an`) — the page is muted, and an audio track can block
autoplay on iOS. Aim for under ~1.5 MB per clip.

## Idle state: clip or still

`IDLE_MODE` in `assets/js/app.js`:

| Value    | Behaviour                                                        |
| -------- | ---------------------------------------------------------------- |
| `'auto'` | Play the idle clip; fall back to the still if it cannot play      |
| `'video'`| Always the clip                                                   |
| `'still'`| Always the still, with CSS carrying the motion                    |

A still idle loops perfectly by definition, costs no bandwidth, and its pulse
can **react to the user** — the ring and scan line accelerate from 2.8s to
0.55s while the visitor holds, which no pre-rendered loop can do. The CSS
pulse is suppressed when the idle is a clip, so the two never beat against
each other.

The fallback is decided by a readiness deadline rather than an `error` event:
a `<video>` with `<source>` children fires `error` on the sources, not on
itself, so there is no single reliable event for "this will never play".

## Aligning overlays to the footage

Overlay positions are expressed as fractions of **the video**, in
`assets/js/app.js` — properties of the render, not of any screen:

```js
var SCAN_POINT = { portrait: { x: 0.500, y: 0.465 }, … };  // scanner plate
var RING_POINT = { portrait: { x: 0.500, y: 0.440, d: 0.66 }, … };  // neon ring
```

`syncOverlay()` reproduces what `object-fit: cover` does — computes the
rendered video size, measures how much is cropped off each edge — and resolves
those fractions into `--ov-x`/`--ov-y`/`--ring-x`/`--ring-y`/`--ring-d`.
Overlays are also *sized* from `--ov-w`, so they scale with the vault rather
than the viewport.

> Do **not** give `.stage__frame` the footage's aspect ratio and position
> overlays as a percentage of it. `aspect-ratio` loses to `min-width`/
> `min-height`, the box collapses to the viewport, and `object-fit` then crops
> by an amount that varies with screen size. That was a real bug: on a 390×844
> iPhone the box measured 0.4621 against the video's 0.5625, so the target sat
> off the plate.

Verify with:

```bash
python3 -m http.server 8000 &
node tools/check-overlay-alignment.js
```

It reports the anchor's position in video coordinates across 16 viewports from
320×568 to 3440×1440. Worst drift should stay near 0.002%, which is rounding.

## Copy and localisation

All user-facing text is in the `COPY` object at the top of `assets/js/app.js`.
Add a locale and change `ACTIVE_LOCALE`; no markup changes needed. Nothing is
baked into the video, which is what makes this cheap.

Current copy is English placeholder. **The offer figures (`100% BONUS`,
`+ 250 free spins`) are placeholders and must be replaced with the real
licensed offer before this goes live**, along with the T&C, privacy and
responsible-gambling links, which currently point at `#` anchors.

## Brand

| Token          | Value     |
| -------------- | --------- |
| `--tb-red`     | `#D91C05` |
| `--tb-red-hot` | `#FF3B21` |
| `--tb-red-deep`| `#8E1103` |
| `--tb-gold`    | `#F5C147` |
| `--tb-ink`     | `#0A0A0C` |

`--tb-red` was sampled from the supplied logo and should be confirmed against
the brand guide. `assets/img/topbet-logo.svg` is a placeholder redraw —
replace it with the official asset.

## Accessibility and resilience

- `prefers-reduced-motion` skips the cinematics and shows the final still with
  the reveal already present.
- Muted autoplay refusal (iOS Low Power Mode) falls back to a tap-to-begin screen.
- The scanner is keyboard-operable (hold Space or Enter) and screen-reader labelled.
- The reservation countdown persists in `localStorage`, so a refresh does not
  hand out a fresh 15 minutes.

## Integration point

`assets/js/app.js` submits nothing. The form validates client-side and stops at
a marked integration point in the `submit` handler — wire it to the real
registration endpoint or affiliate postback there.
