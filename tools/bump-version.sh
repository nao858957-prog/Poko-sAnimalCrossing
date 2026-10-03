#!/bin/sh
# 公開のたびに実行: スマホに古い js/css が残って「新旧がまざる」のを防ぐ (index.html の ?v=... を更新)
V="${1:-$(date +%Y%m%d%H%M)}"
sed -i -E "s/\?v=[0-9a-zA-Z]+/?v=$V/g" "$(dirname "$0")/../index.html"
echo "version -> $V"
