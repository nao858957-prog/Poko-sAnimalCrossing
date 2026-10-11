# あそびかた どうが（実況風ナレーション入り）の作り方

ゲームを自動操作して 1コマずつ撮影し、ナレーション（Irodori-TTS など）を重ねます。
画面は 1920×1080。左にスマホ画面、右に大きな見出し・要点・字幕（ナレーションの文）が出ます。

1. 台本を直すときは `script.mjs`（セリフ・見出し・要点）。`node gen-doc.mjs` で `docs/tutorial-script.md` と
   `voice_script/*.txt`（1行1ファイル）・`voice_script/lines.csv`（ID・開始秒・最大秒・セリフ）を作り直す。
2. `python3 -m http.server 8765`（リポジトリのルートで）
3. `ONLY=s1,s2 node capture.mjs` … シーンごとに撮影（`OUT` に `s1/f00000.jpg …`）。全シーンで約 7,800 コマ。4 並列にすると 30 分ほど。
   セリフを変えるとシーンの長さが変わるので、撮り直しが必要。
4. `./build.sh` … シーンを つないで `tutorial_silent.mp4`（音なし）
5. 音声：`voice_script/<ID>.txt` を Irodori-TTS で読ませ、`voice/<ID>.wav` として保存
6. `node ../trailer/render-bgm.mjs <秒数>` で BGM（`bgm.wav`）を作り、`node mux.mjs voice bgm.wav` → `audio.m4a`
   （各セリフを決まった位置に置く。長すぎる行は 1.3 倍まで早める。BGM は小さめに自動でさげる）
7. `ffmpeg -i tutorial_silent.mp4 -i audio.m4a -c:v copy -c:a copy tutorial.mp4`

※ スクリプト内の Playwright の読み込みパス・出力先は、環境に合わせて書き換えてください。
