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
| `scanning`  | idle clip continues | Ring fills over 1.6s; releasing early resets it  |
| `unlocking` | unlock clip         | "Access granted" badge                           |
| `revealing` | open clip, freezes  | Offer + 15-minute reservation countdown          |
| `register`  | frozen final frame  | Registration card                                |

State lives in `data-state` on `<html>`, so CSS drives all visibility.

## Video assets

> **The clips currently in `assets/video/` are flat-colour placeholders.**
> They exist so the interaction can be developed and tested. Replace them
> with the real renders — same filenames, no code change needed.

```
assets/video/
  vault-idle-9x16.mp4      seamless loop, closed vault, red neon breathing
  vault-unlock-9x16.mp4    scan sweep, bolts retract, door cracks, gold seam
  vault-open-9x16.mp4      door swings open, gold floods, camera pushes in
  vault-{...}-16x9.mp4     desktop cuts of the same three beats
assets/img/
  poster-idle.jpg          first frame of the idle clip
  poster-open.jpg          last frame of the open clip
```

`app.js` picks portrait or landscape sources at runtime via `matchMedia`
(`<source media>` inside `<video>` is not reliably honoured across browsers).

### Encoding the real renders

```bash
# transcode for web
ffmpeg -i raw.mp4 -c:v libx264 -crf 23 -pix_fmt yuv420p \
       -movflags +faststart -an vault-open-9x16.mp4

# seamless idle loop (forward + reversed, so the loop point is invisible)
ffmpeg -i idle-raw.mp4 -filter_complex \
  "[0]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1" \
  -c:v libx264 -crf 23 -pix_fmt yuv420p -an vault-idle-9x16.mp4

# posters
ffmpeg -i vault-idle-9x16.mp4 -frames:v 1 -q:v 3 poster-idle.jpg
ffmpeg -sseof -0.1 -i vault-open-9x16.mp4 -update 1 -frames:v 1 -q:v 3 poster-open.jpg
```

Strip audio (`-an`) — the page is muted, and an audio track can block
autoplay on iOS. Aim for under ~1.5 MB per clip.

### Chaining the clips

Kling animates from a start frame only, so continuity comes from feeding each
rendered clip's true last frame into the next generation:

```bash
ffmpeg -sseof -0.05 -i clip-b.mp4 -update 1 -frames:v 1 -q:v 2 clip-b-last.jpg
```

## Aligning the scanner target

The hold-to-scan control must sit exactly over the vault's scanner plate. It
is positioned in percentages of the video frame, set in `assets/css/style.css`:

```css
--scan-x: 50%;
--scan-y: 38%;   /* portrait */
```

with a landscape override in the `@media (orientation: landscape)` block.
Adjust both once the final renders are in.

Positioning works because `.stage__frame` carries the clips' aspect ratio and
is sized to cover the viewport, so percentage coordinates inside it land on
the same point of the footage at every screen size.

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
