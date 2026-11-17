# TrustifySMM — go live on trustifysmm.com

## This server

| Item | Value |
|------|--------|
| VPS IP | `51.15.21.166` |
| App (PM2) | `127.0.0.1:3036` |
| Process | `pm2 restart trustifysmm` |

## 1. DNS (registrar / Cloudflare)

Point the domain **away from Render** to this VPS:

| Host | Type | Value |
|------|------|--------|
| `@` | A | `51.15.21.166` |
| `www` | A or CNAME | `51.15.21.166` or `trustifysmm.com` |

Wait until `dig +short trustifysmm.com` shows `51.15.21.166`.

## 2. Production env

In `/srv/apps/trustifysmm/.env`:

```bash
SITE_URL=https://trustifysmm.com
ORBIT_PASSKEY=your-secret
```

Then:

```bash
cd /srv/apps/trustifysmm
git pull origin main
npm run build
pm2 restart trustifysmm
```

## 3. Nginx (requires sudo)

```bash
sudo cp /srv/apps/trustifysmm/deploy/nginx/trustifysmm.com.conf \
  /etc/nginx/sites-available/trustifysmm.com
sudo ln -sf /etc/nginx/sites-available/trustifysmm.com \
  /etc/nginx/sites-enabled/trustifysmm.com
sudo nginx -t && sudo systemctl reload nginx
```

## 4. HTTPS

After DNS points here:

```bash
sudo certbot --nginx -d trustifysmm.com -d www.trustifysmm.com
```

## 5. Verify

- https://trustifysmm.com/
- https://trustifysmm.com/signup
- https://trustifysmm.com/orbit/login (noindex)