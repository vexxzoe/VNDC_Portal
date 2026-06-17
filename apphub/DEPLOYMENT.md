# AppHub Deployment Guide

A step-by-step guide for self-hosting AppHub on a Linux server with PM2 and Nginx.

## Requirements

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** 9+
- **PM2**: `npm install -g pm2`
- **Nginx**
- **Certbot** (optional, for HTTPS)

---

## Steps

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd apphub
npm install
```

### 2. Environment

```bash
cp .env.production.example .env.local
```

Edit `.env.local` with your actual values:

```bash
# Generate a secure secret (min 32 characters)
openssl rand -base64 32
```

Key values to set:
- `NEXTAUTH_SECRET` — random secret (use the openssl command above)
- `NEXTAUTH_URL` — your full public URL (e.g. `https://apphub.yourdomain.com`)
- `SMTP_*` — optional, required for email notifications

### 3. Database

```bash
# Apply migrations (safe for production — no data loss)
npx prisma migrate deploy

# Seed initial admin account + sample data
npx prisma db seed
```

Default admin credentials (change after first login):
- Email: `admin@internal.com`
- Password: `admin123`

### 4. Build

```bash
npm run build
```

Confirm output ends with `✓ Compiled successfully`.

### 5. Start with PM2

```bash
pm2 start npm --name "apphub" -- start
pm2 save
pm2 startup
```

Follow the `pm2 startup` output to enable auto-start on reboot.

Useful PM2 commands:
```bash
pm2 status          # check process status
pm2 logs apphub     # tail logs
pm2 restart apphub  # restart after config changes
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/apphub`:

```nginx
server {
    listen 80;
    server_name apphub.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:
```bash
ln -s /etc/nginx/sites-available/apphub /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 7. SSL — HTTPS (recommended)

```bash
certbot --nginx -d apphub.yourdomain.com
```

Certbot will automatically update your Nginx config and set up auto-renewal.

---

## Updating AppHub

```bash
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 restart apphub
```

---

## Backup

The entire database is a single SQLite file:

```bash
# Backup
cp prisma/apphub.db prisma/apphub.db.backup-$(date +%Y%m%d)

# Restore
cp prisma/apphub.db.backup-YYYYMMDD prisma/apphub.db
pm2 restart apphub
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Port 3000 already in use | `pm2 delete apphub` then restart |
| Prisma migration fails | Check `DATABASE_URL` in `.env.local` |
| Email test fails | Verify Gmail App Password (not login password); enable 2FA first |
| Admin panel inaccessible | Log out and log back in — JWT tokens from before role migration need refresh |
