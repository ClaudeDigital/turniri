# Menaxhues Turniri

Tournament management app deployed at `/ngucatinderondeshmoret`.

## Setup

```bash
# 1. Install dependencies
npm run install:all

# 2. Copy logo
cp /root/LogoTurniri.jpg client/public/logo.jpg

# 3. Build frontend
npm run build

# 4. Start server (port 3000)
npm start
```

## Nginx

```bash
cp nginx.conf /etc/nginx/sites-available/turniri
ln -s /etc/nginx/sites-available/turniri /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## Access

- URL: `turniri.gezimm.com/ngucatinderondeshmoret`
- Admin: `admin` / `admin123`

## PM2

```bash
pm2 start server/index.js --name turniri
pm2 save && pm2 startup
```
