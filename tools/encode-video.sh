#!/usr/bin/env bash
#
# Rebuild every clip in assets/video/ from the two original renders.
#
#   tools/encode-video.sh source-video/idle.mp4 source-video/open.mp4
#
# Always encode from the ORIGINALS, never from the files in assets/video/ —
# those are already lossy, and re-encoding them stacks a second generation of
# artefacts on top of the first.
#
# Quality: the ceiling here is the source, which is 1080p. The 9x16 cut is a
# centre crop of it (608x1080), so on a modern phone it is roughly a 2x
# upscale and will look soft no matter what CRF you pass. Fixing that properly
# means re-rendering the master at 4K, not re-encoding this one. See
# docs/asset-pipeline.md.

set -euo pipefail

IDLE_SRC=${1:?usage: encode-video.sh <idle-source.mp4> <open-source.mp4>}
OPEN_SRC=${2:?usage: encode-video.sh <idle-source.mp4> <open-source.mp4>}

FF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
OUT=assets/video
IMG=assets/img
mkdir -p "$OUT" "$IMG"

# CRF 20 / VP9 30 rather than the 23 / 34 this started at. The clips are the
# page's whole visual, they are only a few seconds long, and the earlier
# numbers were throwing away a quarter of the source bitrate for a saving that
# did not matter. Raise the numbers if page weight ever becomes the problem.
X264_CRF=20
VP9_CRF=30

# Crossfade length used to close the idle loop, in frames. The source is
# generated with a matching first and last frame, so this only has to hide
# whatever the model got slightly wrong.
FADE_FRAMES=17

# ffmpeg exits non-zero when asked to probe with no output file, which under
# `set -e` would kill the script mid-assignment. Swallow it deliberately.
probe () { "$FF" -hide_banner -i "$1" 2>&1 || true; }

dur () { probe "$1" | sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' \
         | awk -F: '{print ($1*3600)+($2*60)+$3}'; }

h264 () {   # h264 <in-args...> <out> — output must stay last, after the codec flags
  local out=${*: -1}
  local args=("${@:1:$#-1}")
  "$FF" -v error -y "${args[@]}" -c:v libx264 -crf "$X264_CRF" -preset slow \
        -pix_fmt yuv420p -movflags +faststart -an "$out"
}

echo "→ idle loop (crossfading ${FADE_FRAMES} frames to close the seam)"
T=$(dur "$IDLE_SRC")
D=$(awk -v f="$FADE_FRAMES" 'BEGIN{printf "%.4f", f/24}')
MAIN=$(awk -v t="$T" -v d="$D" 'BEGIN{printf "%.4f", t-d}')
OFF=$(awk  -v t="$T" -v d="$D" 'BEGIN{printf "%.4f", t-2*d}')

# xfade refuses a variable frame rate, and trim leaves the rate undefined —
# hence the explicit fps on each branch.
LOOP="[0]split[a][b];\
[a]trim=0:${MAIN},setpts=PTS-STARTPTS,fps=24[main];\
[b]trim=${MAIN}:${T},setpts=PTS-STARTPTS,fps=24[tail];\
[main][tail]xfade=transition=fade:duration=${D}:offset=${OFF}"

h264 -i "$IDLE_SRC" -filter_complex "$LOOP"                      "$OUT/vault-idle-16x9.mp4"
h264 -i "$IDLE_SRC" -filter_complex "${LOOP}[v];[v]crop=ih*9/16:ih" "$OUT/vault-idle-9x16.mp4"

echo "→ opening clip"
h264 -i "$OPEN_SRC"                                              "$OUT/vault-open-16x9.mp4"
h264 -i "$OPEN_SRC" -vf "crop=ih*9/16:ih"                        "$OUT/vault-open-9x16.mp4"

# VP9 for Chromium builds without proprietary codecs. Derived from the H.264
# files rather than the source only because the loop and crop are already
# baked in there; the quality cost at these CRFs is not visible.
echo "→ VP9 fallbacks"
for f in "$OUT"/*.mp4; do
  "$FF" -v error -y -i "$f" -c:v libvpx-vp9 -crf "$VP9_CRF" -b:v 0 \
        -row-mt 1 -pix_fmt yuv420p -an "${f%.mp4}.webm"
done

echo "→ posters"
"$FF" -v error -y -i "$OUT/vault-idle-9x16.mp4" -frames:v 1 -q:v 2 "$IMG/poster-idle.jpg"
"$FF" -v error -y -sseof -0.1 -i "$OUT/vault-open-9x16.mp4" -update 1 \
      -frames:v 1 -q:v 2 "$IMG/poster-open.jpg"

echo
printf '%-26s %8s  %s\n' FILE SIZE STREAM
for f in "$OUT"/* "$IMG"/poster-*.jpg; do
  printf '%-26s %8s  %s\n' "$(basename "$f")" "$(du -h "$f" | cut -f1)" \
    "$(probe "$f" | sed -n 's/.*Video: \([a-z0-9]*\).*, \([0-9]*x[0-9]*\).*/\1 \2/p' | head -1)"
done
