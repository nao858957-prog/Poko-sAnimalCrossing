# 紹介動画（トレーラー）の作り方

ゲームを自動操作して 1コマずつ撮影 → ffmpeg で動画にします（時間を固定して進めるので、カクつきません）。

1. `python3 -m http.server 8765`（リポジトリのルートで）
2. `node render-bgm.mjs` … ゲームと同じ音づくりの BGM を `game_bgm.wav` に書き出す
3. `node capture.mjs` … 60秒ぶん（1800コマ）を撮影（約9分）
4. `ffmpeg -framerate 30 -i f3/f%04d.jpg -i game_bgm.wav -t 60 -vf scale=1920:1080 -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -af "afade=t=in:d=1.5,afade=t=out:st=56.5:d=3.5" trailer.mp4`

※スクリプト内の出力先・Playwright の読み込みパスは、環境に合わせて書き換えてください。
キャッチコピーなどの文言は `capture.mjs` の `stage(...)` の引数にあります。

## BGM と こうかおんを いれる（電子音版 BGM）
1. 撮影のとき、`capture.mjs` / `capture-short.mjs` が「どのコマで どの効果音が鳴ったか」を `<OUT>_sfx.json` に書き出す（`DRY=1` なら画像なしで 短時間でできる）。
2. `node ../music/render-bgm.mjs 101 bgm_long.wav 0`（ショートは `36 bgm_short.wav 4`）と `node ../music/render-sfx.mjs`
3. `node mix-audio.mjs long|short <映像.mp4> <_sfx.json> <bgm.wav> <出力.mp4>`
   … ゲームの効果音（タップ・ハート・つり・チャオなど）＋場面転換の「ふわっ」＋ラストの「きらーん」を BGM に重ね、音量をそろえて映像に付ける。
