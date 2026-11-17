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

Proxied (orange cloud) records show Cloudflare IPs (`104.21.x`, `172.67.x`) in `dig` — that is normal. Origin in Cloudflare must still be `51.15.21.166`.

At the **registrar**, nameservers must be only Cloudflare (e.g. `coleman.ns.cloudflare.com`, `linda.ns.cloudflare.com`). Until those are set, some networks show `DNS_PROBE_FINISHED_NXDOMAIN`.

### Browser says “This site can’t be reached” / NXDOMAIN

The VPS app is healthy (`https://trustifysmm.com` responds when DNS is correct). Fix on your PC:

1. **Windows:** Run Command Prompt as admin → `ipconfig /flushdns`
2. Set DNS to **1.1.1.1** and **1.0.0.1** (Cloudflare) or **8.8.8.8** / **8.8.4.4** (Google) in Wi‑Fi → adapter → IPv4 DNS
3. Close Chrome completely and reopen; try https://trustifysmm.com/signin
4. Check https://dnschecker.org/#A/trustifysmm.com — should show Cloudflare anycast IPs worldwide

**Why your PC fails but Cloudflare DNS works:** you moved nameservers from Hostinger to Cloudflare today. Many ISP resolvers (and this VPS default DNS) still return **Hostinger parking** with **no A record** for 15 minutes–24 hours. Google/Cloudflare DNS already returns `104.21.x` / `172.67.x`.

**Instant fix on Windows (1 minute):**

1. Download / run `deploy/windows-fix-dns.bat` **as Administrator** (sets DNS to 1.1.1.1), **or**
2. Edit `C:\Windows\System32\drivers\etc\hosts` as Admin — paste lines from `deploy/hosts-trustifysmm-snippet.txt`, then `ipconfig /flushdns`, open https://trustifysmm.com/signin

**Temporary test:** `https://51.15.21.166/signin` only works if nginx `server_name` includes the IP (`sudo bash deploy/scripts/patch-nginx-ip-servername.sh`). Otherwise use the hosts file method above.

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