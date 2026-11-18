#!/usr/bin/env bash
# Refreshes open orders every minute. A fulfilment cancellation refunds the customer wallet.
#
#   /etc/cron.d/trustify-order-sync:
#   * * * * * sysadmin /srv/apps/trustifysmm/scripts/order-sync-cron.sh >> /var/log/trustify-order-sync.log 2>&1
#
# The token stays on the server. Nothing is printed unless the refresh fails.
set -euo pipefail

APP_DIR="/srv/apps/trustifysmm"
PORT="${PORT:-3036}"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "missing $APP_DIR/.env" >&2
  exit 1
fi

TOKEN="$(sed -n 's/^SESSION_SECRET=//p' "$APP_DIR/.env" | head -n 1 | tr -d '"'\''' | tr -d '\r')"
if [ -z "$TOKEN" ]; then
  TOKEN="$(sed -n 's/^ORBIT_PASSKEY=//p' "$APP_DIR/.env" | head -n 1 | tr -d '"'\''' | tr -d '\r')"
fi
if [ -z "$TOKEN" ]; then
  echo "no internal token available" >&2
  exit 1
fi

curl -fsS -m 45 -X POST "http://127.0.0.1:${PORT}/api/internal/order-sync" \
  -H "x-internal-token: ${TOKEN}" \
  -H "content-type: application/json" \
  --data '{}' > /dev/null
