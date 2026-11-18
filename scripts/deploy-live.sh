#!/usr/bin/env bash
# Build beside the running site, then swap the finished build in and restart.
# `next build` inside the live folder deletes .next while pages are still being served,
# which is what made the site, the dashboard and Orbit error during a deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d /tmp/trustify-build-XXXXXX)"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

rsync -a --delete \
  --exclude .next \
  --exclude .next-old \
  --exclude node_modules \
  --exclude data/runtime \
  --exclude .git \
  "$ROOT/" "$STAGE/"
ln -s "$ROOT/node_modules" "$STAGE/node_modules"

(
  cd "$STAGE"
  npm run build
)

rm -rf "$ROOT/.next-old"
if [ -d "$ROOT/.next" ]; then
  mv "$ROOT/.next" "$ROOT/.next-old"
fi
mv "$STAGE/.next" "$ROOT/.next"
trap - EXIT
rm -rf "$STAGE"

pm2 restart trustifysmm --update-env
sleep 2
code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3036/ || true)"
if [ "$code" != "200" ]; then
  echo "Site returned $code after restart. Previous build is in .next-old." >&2
  exit 1
fi
rm -rf "$ROOT/.next-old"
echo "Live on port 3036."
