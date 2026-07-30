#!/usr/bin/env python3
"""
Bundle the landing page into one self-contained HTML file.

Artifacts run under a strict CSP that blocks every external request, so the
page has to carry its own assets as data: URIs. This also produces a file you
can open from disk or email to someone, with no server involved.

    python3 tools/build-artifact.py [--assets DIR] [-o OUT]

--assets points at the directory holding the video/poster files to embed;
it defaults to the repo's own assets/, but a demo build can point at smaller
re-encodes so the bundle stays a sane size.
"""

import argparse
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

MIME = {
    '.mp4':  'video/mp4',
    '.webm': 'video/webm',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.woff2': 'font/woff2',
}

CLIPS = ['vault-idle-9x16', 'vault-idle-16x9',
         'vault-open-9x16', 'vault-open-16x9']


def data_uri(path: pathlib.Path) -> str:
    mime = MIME[path.suffix.lower()]
    payload = base64.b64encode(path.read_bytes()).decode('ascii')
    return f'data:{mime};base64,{payload}'


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--assets', default=None,
                    help='directory of videos/posters to embed (default: assets/)')
    ap.add_argument('-o', '--out', default='dist/artifact.html')
    args = ap.parse_args()

    html  = (ROOT / 'index.html').read_text()
    fonts = (ROOT / 'assets/css/fonts.css').read_text()
    css   = (ROOT / 'assets/css/style.css').read_text()
    js    = (ROOT / 'assets/js/app.js').read_text()

    # The artifact is a single file with no sibling directory, so the woff2
    # files the font sheet points at have to travel inside it. Latin only —
    # inlining every cyrillic face too would add ~350 KB for a locale the
    # artifact preview does not exercise.
    def inline_fonts(sheet: str) -> str:
        keep, dropped = [], 0
        for block in re.split(r'(?=/\* [a-z-]+ \*/)', sheet):
            m = re.match(r'/\* ([a-z-]+) \*/', block.strip())
            if m and 'cyrillic' in m.group(1):
                dropped += 1
                continue
            ref = re.search(r'url\(\.\./fonts/([A-Za-z0-9._-]+)\)', block)
            if ref:
                path = ROOT / 'assets/fonts' / ref.group(1)
                if not path.exists():
                    print(f'  ! missing font {ref.group(1)}', file=sys.stderr)
                    continue
                block = block.replace(f'../fonts/{ref.group(1)}', data_uri(path))
            keep.append(block)
        if dropped:
            print(f'  cyrillic subsets omitted from the artifact ({dropped} faces)')
        return ''.join(keep)

    fonts = inline_fonts(fonts)

    media = pathlib.Path(args.assets) if args.assets else None

    def find(name: str) -> pathlib.Path:
        """Prefer the override directory, fall back to the repo's assets."""
        if media:
            for cand in (media / name,
                         media / name.replace('vault-', ''),
                         media / pathlib.Path(name).name):
                if cand.exists():
                    return cand
        for cand in (ROOT / 'assets/video' / name, ROOT / 'assets/img' / name):
            if cand.exists():
                return cand
        raise FileNotFoundError(name)

    # --- videos ------------------------------------------------------------
    # app.js builds "<basename>.webm" / "<basename>.mp4" at runtime, so the
    # lookup table is keyed by basename and setClip is redirected into it.
    table = []
    for clip in CLIPS:
        entry = []
        for ext in ('.webm', '.mp4'):
            try:
                entry.append(f'{ext.lstrip(".")}:"{data_uri(find(clip + ext))}"')
            except (FileNotFoundError, KeyError):
                pass                      # a missing format just isn't offered
        if not entry:
            print(f'  ! no media for {clip}', file=sys.stderr)
        table.append(f'"assets/video/{clip}":{{{",".join(entry)}}}')

    js = js.replace(
        "sources[0].src = base + '.webm';\n    sources[1].src = base + '.mp4';",
        "var inl = window.__INLINE_MEDIA[base] || {};\n"
        "    sources[0].src = inl.webm || '';\n"
        "    sources[1].src = inl.mp4 || '';")
    if '__INLINE_MEDIA' not in js:
        print('  ! setClip patch did not apply — check app.js formatting',
              file=sys.stderr)
        return 1

    # --- images referenced from the markup ---------------------------------
    # Discovered from the HTML rather than hard-coded, so renaming an asset
    # cannot silently drop it from the bundle.
    for name in sorted(set(re.findall(r'assets/img/([A-Za-z0-9._-]+)', html))):
        try:
            uri = data_uri(find(name))
        except (FileNotFoundError, KeyError):
            print(f'  ! could not inline assets/img/{name}', file=sys.stderr)
            continue
        html = html.replace(f'assets/img/{name}', uri)

    if 'assets/img/' in html:
        left = set(re.findall(r'assets/img/[A-Za-z0-9._-]+', html))
        print(f'  ! still referencing external images: {left}', file=sys.stderr)
        return 1

    # --- strip the parts the artifact wrapper supplies ----------------------
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S)
    if not body:
        print('  ! could not find <body>', file=sys.stderr)
        return 1
    body_html = body.group(1)
    body_html = re.sub(r'<script[^>]*src="[^"]*"[^>]*>\s*</script>', '', body_html)

    title = re.search(r'<title>(.*?)</title>', html, re.S)
    title = title.group(1).strip() if title else 'Topbet'

    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        f'<title>{title}</title>\n'
        f'<style>\n{fonts}\n{css}\n</style>\n'
        f'{body_html}\n'
        f'<script>window.__INLINE_MEDIA={{{",".join(table)}}};</script>\n'
        f'<script>\n{js}\n</script>\n')

    kb = out.stat().st_size / 1024
    print(f'wrote {out}  ({kb:.0f} KB)')
    if kb > 9000:
        print('  ! large bundle — consider smaller re-encodes', file=sys.stderr)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
