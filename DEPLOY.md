# Deploying this page

Static HTML, CSS and vanilla JS. **No build step, no dependencies, no Node, no
package.json.** Whatever serves files over HTTP will serve this.

## What has to ship

```
index.html
assets/css/     style.css, fonts.css
assets/js/      app.js
assets/fonts/   24 .woff2 files
assets/video/   8 clips (mp4 + webm, portrait + landscape)
assets/img/     logo + 2 posters
```

`source-video/`, `tools/` and the `.md` files are for maintenance — they do not
need to be on the server, but nothing breaks if they are.

Total payload is ~5 MB, but a visitor downloads far less than that: `app.js`
picks portrait *or* landscape sources at runtime, and the browser takes either
the `.webm` or the `.mp4`, never both. A phone pulls roughly 850 KB of video.

## Deploy

### Any static host / CDN

Upload the repository root so `index.html` sits at the URL you want to serve.
That is the whole procedure — Netlify, Vercel, Cloudflare Pages, S3 +
CloudFront, or a plain nginx docroot all work with no configuration.

### Existing web server (nginx / Apache)

Copy the files into the docroot. The only thing worth adding is caching, since
every asset is content-addressable by name:

```nginx
location ~* \.(woff2|mp4|webm|jpg|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
location ~* \.(html)$ {
    add_header Cache-Control "no-cache";
}
```

Make sure the server sends the right MIME types — `video/mp4`, `video/webm`,
`font/woff2`. Modern nginx and Apache do by default; some older configs do not
know `.webm` or `.woff2`, and a wrong type on the video is silent (the clip
just never plays).

### GitHub Pages

Currently deployed this way from the `claude/topbet-landing-page-kjw1su`
branch. Settings → Pages → Source: *Deploy from a branch*, branch + `/ (root)`.

Pages rebuilds **on push**, not when you change the settings — if the site is
missing right after enabling it, push any commit. Watch the Actions tab for
`pages-build-deployment`.

### Single-file build

For affiliate platforms and ad networks that take one HTML file:

```bash
python3 tools/build-artifact.py -o dist/artifact.html
```

Inlines the CSS, JS, fonts, images and video as data URIs. The result is ~6.6 MB
because base64 costs a third on top, so use it only where a single file is
genuinely required. Cyrillic font subsets are dropped from this build.

## Before it goes live

The page is finished as an interaction; these are the content and integration
gaps, all of them small edits:

1. **The form does not submit anywhere.** `app.js` validates client-side and
   stops at a commented integration point in the `submit` handler. Wire it to
   the real registration endpoint or affiliate postback.
2. **Links point at `#`** — terms, responsible gambling, and "Kirish"
   (log in). Search `index.html` and `app.js` for `'#'`.
3. **Offer figures are placeholders** — `150 000 UZS`, `55 000 UZS`, and the
   10-minute reservation window. All of it lives in the `COPY` object at the
   top of `app.js`; nothing is baked into the video, which is the point.
4. **The Russian copy has not been reviewed by a native speaker.**
5. `<meta name="robots" content="noindex">` is set in `index.html`. Remove it
   when the page should be indexed — or leave it if traffic is paid-only.

## Changing things

**Copy and languages** — the `COPY` object at the top of `assets/js/app.js`.
Add a locale key, add it to `LOCALES`, done; no markup changes.

**Video** — replace the files in `assets/video/`, same names, no code change.
If you re-render rather than re-encode, re-check the overlay alignment:

```bash
python3 -m http.server 8000 &
node tools/check-overlay-alignment.js       # needs `npm i playwright`
```

The scanner target is pinned to a point in the *footage*, not to the screen,
so new footage means re-measuring `SCAN_POINT` / `RING_POINT` / `VAULT_HALF_W`
in `app.js`. `docs/asset-pipeline.md` explains how.

To re-encode the existing renders, use `tools/encode-video.sh` against the
files in `source-video/` — never against `assets/video/`, which is already
lossy.

**Timings** — `HOLD_MS` (hold-to-scan duration), `LOCK_MINUTES` (countdown),
`CROSSFADE_MS`, all at the top of `app.js`.

## Browser support

Chrome, Safari, Firefox, Edge, and the iOS/Android in-app browsers.

- Muted autoplay is refused in iOS Low Power Mode; the page detects the
  rejected `play()` and falls back to a tap-to-begin screen.
- `prefers-reduced-motion` skips the cinematics and shows the reveal directly.
- WebM exists for Chromium builds without proprietary codecs; everything else
  takes the MP4.
- `text-box: trim-both` is used for the design's cap-height trimming. Firefox
  does not support it yet and gets slightly taller cards — a difference of a
  few pixels, not a broken layout.
