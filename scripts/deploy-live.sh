#!/usr/bin/env bash
# Build beside the running site, start the new app on a spare port, then
# point the stable front door at it. The live process on port 3036 is not
# stopped and .next is not moved out from under it.
# Git push does not run this script. GitHub CI only typechecks and builds
# on GitHub's runners.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d /tmp/trustify-build-XXXXXX)"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

rsync -a --delete \
  --exclude .next \
  --exclude .next-old \
  --exclude .releases \
  --exclude node_modules \
  --exclude data/runtime \
  --exclude .git \
  "$ROOT/" "$STAGE/"
ln -s "$ROOT/node_modules" "$STAGE/node_modules"

(
  cd "$STAGE"
  npm run build
)

mkdir -p "$ROOT/.releases"
CURRENT=""
if [[ -f "$ROOT/.live-upstream" ]]; then
  CURRENT="$(tr -d '[:space:]' < "$ROOT/.live-upstream")"
fi
PORT=""
for candidate in 3038 3039 3040 3037; do
  if [[ "$candidate" == "$CURRENT" ]]; then
    continue
  fi
  if ss -ltn | grep -q ":${candidate} "; then
    continue
  fi
  PORT="$candidate"
  break
done
if [[ -z "$PORT" ]]; then
  echo "No free app port. Live site left untouched." >&2
  exit 1
fi
SLOT="p${PORT}"

REL="$ROOT/.releases/$SLOT"
rm -rf "$REL"
mkdir -p "$REL"
rsync -a --delete \
  --exclude node_modules \
  --exclude data \
  --exclude .git \
  "$STAGE/" "$REL/"
ln -sfn "$ROOT/node_modules" "$REL/node_modules"
ln -sfn "$ROOT/data" "$REL/data"
ln -sfn "$ROOT/.env" "$REL/.env"

NAME="trustifysmm-$SLOT"
pm2 delete "$NAME" >/dev/null 2>&1 || true
pm2 start npm --name "$NAME" --cwd "$REL" --update-env -- start -- --port "$PORT"

code="000"
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${PORT}/signin" || true)"
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 0.5
done
if [[ "$code" != "200" ]]; then
  echo "New app on ${PORT} returned ${code}. Leaving the live site untouched." >&2
  pm2 delete "$NAME" >/dev/null 2>&1 || true
  exit 1
fi

printf '%s\n' "$PORT" > "$ROOT/.live-upstream"

front="$(curl -sI --max-time 2 http://127.0.0.1:3036/signin | tr -d '\r' | awk 'tolower($1)=="x-trustify-front:" { print $2; exit }')"
if [[ "$front" != "1" ]]; then
  echo "Installing the stable front door on port 3036."
  gap_file="$(mktemp)"
  (
    for _ in $(seq 1 200); do
      c="$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 http://127.0.0.1:3036/signin || true)"
      if [[ "$c" != "200" ]]; then
        printf 'x' >> "$gap_file"
      fi
      sleep 0.05
    done
  ) &
  probe=$!
  pm2 stop trustifysmm >/dev/null 2>&1 || true
  for _ in $(seq 1 80); do
    if ! ss -ltn | grep -q ':3036 '; then
      break
    fi
    sleep 0.05
  done
  pm2 start "$ROOT/scripts/live-front.mjs" --name trustifysmm-front --cwd "$ROOT" --interpreter node --update-env
  ok="000"
  for _ in $(seq 1 40); do
    ok="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:3036/signin || true)"
    if [[ "$ok" == "200" ]]; then
      break
    fi
    sleep 0.25
  done
  if [[ "$ok" != "200" ]]; then
    kill "$probe" >/dev/null 2>&1 || true
    echo "Front door failed. Starting the previous app again." >&2
    pm2 restart trustifysmm --update-env || pm2 start npm --name trustifysmm --cwd "$ROOT" -- start -- --port 3036
    exit 1
  fi
  kill "$probe" >/dev/null 2>&1 || true
  wait "$probe" 2>/dev/null || true
  misses="$(wc -c < "$gap_file" | tr -d ' ')"
  rm -f "$gap_file"
  echo "Front-door handoff missed responses: ${misses}."
  pm2 delete trustifysmm >/dev/null 2>&1 || true
else
  sleep 1
fi

if [[ -n "$CURRENT" && "$CURRENT" != "$PORT" ]]; then
  pm2 delete "trustifysmm-p${CURRENT}" >/dev/null 2>&1 || true
  pm2 delete trustifysmm-a >/dev/null 2>&1 || true
  pm2 delete trustifysmm-b >/dev/null 2>&1 || true
fi

# Keep the last two release folders only.
find "$ROOT/.releases" -mindepth 1 -maxdepth 1 -type d ! -name "$SLOT" -mtime +1 -exec rm -rf {} +

public="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3036/signin || true)"
dash="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3036/dashboard || true)"
echo "Live front :3036 -> :${PORT}. Sign-in ${public}. Dashboard route ${dash}."
if [[ "$public" != "200" ]]; then
  exit 1
fi
