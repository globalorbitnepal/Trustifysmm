#!/usr/bin/env bash
# Adds VPS IP to trustifysmm nginx server_name (IP access while DNS propagates).
set -euo pipefail
CONF=/etc/nginx/sites-available/trustifysmm.com
grep -q '51.15.21.166' "$CONF" || sed -i 's/trustifysmm.com www.trustifysmm.com/trustifysmm.com www.trustifysmm.com 51.15.21.166/g' "$CONF"
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx reloaded — https://51.15.21.166/signin should work."