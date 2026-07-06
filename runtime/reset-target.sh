#!/bin/sh
# 실험 대상(example-target)을 baseline 으로 리셋하고 지정한 버그셋을 주입한다.
# 사용: sh reset-target.sh runA|runB
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HERE/example-target"
SET="$1"
[ -n "$SET" ] || { echo "사용: sh reset-target.sh runA|runB"; exit 2; }
FIX="$HERE/experiment-fixtures/$SET"
[ -d "$FIX" ] || { echo "버그셋 없음: $FIX"; exit 2; }
cd "$TARGET"
git checkout HEAD -- . 2>/dev/null
git clean -fdq
cp -f "$FIX/src/stats.js" "$TARGET/src/stats.js"
cp -f "$FIX/test/stats.test.js" "$TARGET/test/stats.test.js"
echo "리셋 완료: example-target ← baseline + $SET"
