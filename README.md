# Topbet — Interactive Vault Landing Page

A mobile-first landing page built around a vault-opening interaction. Copy is
Uzbek; the layout follows the Figma file *Topbet-LP* (Dynamic 1 / 2 / 3).

**Two CTAs open the vault**, and both land in the same place:

1. **Hold the scanner** — press and hold the plate on the vault door itself.
2. **SEYFNI OCHISH** — a plain button, for anyone who never tries a long press.

The vault then swings open, reveals the amount, and hands off to registration.

Static HTML/CSS/vanilla JS. No build step, no dependencies.

**Live:** https://design-mkt-1.github.io/safe-interactive-lp/

Served by GitHub Pages from this branch's root. Pages rebuilds on every push;
it does **not** rebuild when you change the Pages settings, so if the site is
missing right after enabling it, push any commit to trigger the first build.
Watch progress under the repo's Actions tab as `pages-build-deployment`.

Locally:

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Interaction flow

| State       | Video               | Overlay                                          |
| ----------- | ------------------- | ------------------------------------------------ |
| `idle`      | idle clip, looping  | Offer card, scanner target, SEYFNI OCHISH        |
| `scanning`  | idle clip continues | Plate outline fills over 1.6s; release resets it |
| `unlocking` | opening clip        | "Access granted" badge, clears before the reveal |
| `revealing` | opening clip frozen | SEYF OCHILDI + 10-minute reservation countdown   |
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

### The idle → opening transition

The visitor completes the hold at an arbitrary point in the idle loop, so the
opening clip's first frame can never match what is on screen. A 420ms opacity
crossfade covers the discontinuity, which means **the opening clip does not
need to start on the idle clip's last frame** — it only needs to start on the
same *set*, at the same camera position.

The opening clip is held paused on frame zero for the duration of the blend
and only plays once it is fully opaque. Playing it immediately would spend the
first 420ms of the door unlocking behind a semi-transparent layer. `app.js`
publishes `CROSSFADE_MS` as `--clip-fade` so the CSS transition and the delayed
`play()` cannot drift apart.

For the same reason `#clipOpen`'s `poster` is the **closed** vault, not the
open one: that element is visible during the blend, before playback starts.

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

### Where the vault sits

Portrait centres it. Landscape does **not** use a fixed position: `syncOverlay`
measures the content column and places the vault so the door's right edge stops
`VAULT_CARD_GAP` short of the card's left edge.

This cannot be solved in one step. Moving the vault left forces the video to
scale *up* — off-centre pinning needs more size than plain cover, because the
longer side of the split has to span further — which makes the door wider
again. Four passes settle it to well under a pixel.

`VAULT_HALF_W` is half the door's steel frame as a fraction of the video width,
measured off the 16:9 cut where the square spans 37.5% to 62.5%. Re-measure it
if the footage is ever re-rendered; nothing else in the page knows how wide the
vault is.

## Copy and localisation

All user-facing text is in the `COPY` object at the top of `assets/js/app.js`.
Add a locale and change `ACTIVE_LOCALE`; no markup changes needed. Nothing is
baked into the video, which is what makes this cheap.

Copy is Uzbek (`ACTIVE_LOCALE = 'uz'`), taken from the Figma file. Russian is
wired up too; the header switcher offers UZ and RU and the choice persists in
`localStorage`. **The Russian copy is a translation of the Uzbek and has not
been reviewed by a native speaker.**

## Matching the Figma

Desktop is transcribed from the 1920×1080 frames rather than approximated.
Every size in the desktop block is the design's own pixel value multiplied by
`--fu`, one Figma pixel expressed against the viewport:

```css
--fu: min(0.0520833vw, 0.0925926vh, 1.25px);
```

The `vw` term reproduces the design exactly on a 16:9 screen; the `vh` term
keeps the 718px-tall reveal card inside short landscape windows; the ceiling
stops it growing past QHD. Writing sizes this way means the composition scales
as one piece — with independent `clamp()`s per element, the type and the box
drift apart at intermediate widths.

Measured against the design at 1920×1080 (`x`/`w` are the card's):

| State    | x (design)   | w (design)  | h (design)  |
| -------- | ------------ | ----------- | ----------- |
| idle     | 1008 (1008)  | 820 (820)   | 573 (576)   |
| reveal   | 1008 (1008)  | 820 (820)   | 730 (718)   |
| register | 1280 (1253)  | 548 (548)   | 600 (585)   |

The registration card is deliberately 27px right of the design. The Figma gives
it a 119px right margin where the other two states use 92px; holding one margin
keeps the card and the language chip from jumping sideways between states.

Two details are load-bearing and easy to lose:

- **Fonts are self-hosted** (`assets/fonts/`, `assets/css/fonts.css`). Beyond
  removing a third-party request from the critical path, this is what makes the
  design's type sizes work at all: the fallback face is ~17% wider than Fira
  Sans Condensed, so a headline sized against the fallback comes out far too
  small. Only latin and cyrillic subsets ship — UZ needs latin, RU cyrillic.
- **`text-box: trim-both cap alphabetic`** on the display lines, which is what
  Figma's `text-box-trim` does. Without it the ascender/descender slack adds up
  and the idle card measures 641px against the design's 576. Browsers without
  support just get a slightly taller card.

### What is not from the Figma

- The **18+ badge and the legal footer** are additions. The design has no
  compliance furniture; on a gambling landing page it is not optional.
- The **"hold the scanner" hint** under the idle CTA — the design has only the
  button, but CTA #1 is invisible without a prompt.
- Six **icons** are redrawn inline at the design's geometry, not the Figma
  exports: sparkles, clock, telephone, mail, gift-wrap, and the flag pair.
  Figma's asset host is unreachable from this environment. Every one is sized
  to the designed outer box and leaf; swap in the real exports when available.
- The design shows the registration submit at 50% opacity (disabled until the
  form validates). This build keeps it active and validates on submit.

Open questions carried over from the design, all still placeholders:

- The T&C, responsible-gambling and "Kirish" links point at `#` anchors.
- The design's form showed Turkish leftovers from a template (`Türkiye (TR)`,
  `Zaten bir hesabınız var mı? Giriş yap`, a `396-000-0000` mask). Those are
  built here as Uzbek — UZ flag, `+998`, `Hisobingiz bormi? Kirish` — which is
  an assumption worth confirming.
- The design says *Sizda 10 daqiqa bor* ("you have 10 minutes") while its
  timer reads `14:55`. The copy wins here: `LOCK_MINUTES = 10`.

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
