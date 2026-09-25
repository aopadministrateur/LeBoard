#!/bin/sh
# Lance un scenario dans Chrome sans interface, sur une copie de l'app branchee sur un faux Firebase
# (tests/mock.js) : aucun appel vers la base de production.
# Usage : sh tests/run.sh <mode> [LxH]      LxH = faire une capture d'ecran au lieu d'afficher le resultat
#   Variables : SCEN=auth-scenario.js (defaut scenario.js), BUDGET=ms de temps virtuel (defaut 20000)
# Les fichiers generes (copie de l'app, captures) vont dans tests/.out/, ignore par git : ils contiennent le seed.
T="$(cd "$(dirname "$0")" && pwd)"; REPO="$(dirname "$T")"; OUT="$T/.out"; mkdir -p "$OUT"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
node "$T/mkharness.js" "$REPO" "$OUT/harness.html" || exit 1
URL="file:///$(cygpath -m "$OUT/harness.html")#$1"
PROF="$OUT/prof-$$"
if [ -n "$2" ]; then
  "$CHROME" --headless=new --disable-gpu --user-data-dir="$(cygpath -w "$PROF")" --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=${BUDGET:-20000} --window-size="$2" --screenshot="$(cygpath -w "$OUT/shot-$1.png")" "$URL" >/dev/null 2>&1
  echo "capture : $OUT/shot-$1.png"
else
  "$CHROME" --headless=new --disable-gpu --user-data-dir="$(cygpath -w "$PROF")" --allow-file-access-from-files --virtual-time-budget=${BUDGET:-20000} --dump-dom "$URL" 2>/dev/null > "$OUT/dom-$1.html"
  node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/<pre id="testout">([\s\S]*?)<\/pre>/);console.log(m?m[1].replace(/&quot;/g,String.fromCharCode(34)).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"):"PAS DE RESULTAT (augmenter BUDGET ?)");' "$OUT/dom-$1.html"
fi
rm -rf "$PROF"
