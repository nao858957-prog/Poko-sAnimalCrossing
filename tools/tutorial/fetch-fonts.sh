#!/bin/sh
# 字幕・見出し用の フォント (M PLUS Rounded 1c, SIL OFL) を ダウンロード。ない環境では 中国語の字形に なることが あります
cd "$(dirname "$0")" && mkdir -p fonts
curl -s -o fonts/MPLUSRounded1c-700.ttf https://fonts.gstatic.com/s/mplusrounded1c/v22/VdGBAYIAV6gnpUpoWwNkYvrugw9RuM064ZsK.ttf
curl -s -o fonts/MPLUSRounded1c-800.ttf https://fonts.gstatic.com/s/mplusrounded1c/v22/VdGBAYIAV6gnpUpoWwNkYvrugw9RuM0m4psK.ttf
