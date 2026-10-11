#!/bin/sh
# 撮影した コマ (FRAMES/<scene>/f*.jpg) から どうがを つくる
#   使い方: FRAMES=/tmp/claude-0/tut ./build.sh      → tutorial_silent.mp4 / (audio.m4a が あれば) tutorial.mp4
set -e
FRAMES=${FRAMES:-/tmp/claude-0/tut}
cd "$(dirname "$0")"
: > clips.txt
for s in $(node -e "import('./script.mjs').then(m=>console.log(m.SCENES.map(s=>s.id).join(' ')))"); do
  ffmpeg -y -loglevel error -framerate 20 -i "$FRAMES/$s/f%05d.jpg" -vf "fps=30,scale=1920:1080" -c:v libx264 -crf 22 -pix_fmt yuv420p "$FRAMES/$s.mp4"
  echo "file '$FRAMES/$s.mp4'" >> clips.txt
done
ffmpeg -y -loglevel error -f concat -safe 0 -i clips.txt -c copy tutorial_silent.mp4
echo "silent ok"
