# Deployment (no Docker) — quick guide

This guide shows how to deploy the app without Docker using PM2 and Nginx on an Ubuntu server.

1) Provision a Linux VM (Ubuntu 22.04 recommended).

2) Install required packages:

```bash
sudo apt update
sudo apt install -y nginx git build-essential curl
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

3) Clone and install:

```bash
cd /var/www
sudo git clone <your-repo-url> kirana-shop
cd kirana-shop/client
npm ci
npm run build
sudo mkdir -p /var/www/kirana
sudo cp -r dist/* /var/www/kirana/

cd ../..
cd server
npm ci
```

4) Configure environment variables (use a secure method):

Create `/etc/kirana.env` (owned by root) with:

```
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongo-uri
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://yourdomain.com
```

Load it in PM2 ecosystem or use `export $(cat /etc/kirana.env | xargs)` before starting.

5) Start the server with PM2:

```bash
cd /var/www/kirana-shop/server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

6) Configure Nginx:

Copy `deploy/nginx_kirana.conf` to `/etc/nginx/sites-available/kirana` and enable it:

```bash
sudo cp deploy/nginx_kirana.conf /etc/nginx/sites-available/kirana
sudo ln -s /etc/nginx/sites-available/kirana /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

7) Obtain TLS (Let's Encrypt):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

8) Final checks:
- Verify `/api` proxies to the Node server
- Test register/login, cart, checkout flows
- Set up backups for MongoDB (Atlas recommended)

9) Provision MongoDB Atlas (quick steps)

- Create an Atlas account at https://www.mongodb.com/cloud/atlas
- Create a free or paid cluster and wait for it to be ready.
- Create a database user and password (save credentials securely).
- In Network Access, add your server's public IP (or 0.0.0.0/0 for testing, not recommended for production).
- Get the connection string from "Connect" → "Connect your application" and copy the URI.
- Set `MONGODB_URI` in `/etc/kirana.env` to the copied URI (replace username/password and db name).

Example URI:
```
mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/kirana?retryWrites=true&w=majority
```

If you want, I can adapt these steps to your cloud provider or generate the exact commands for your domain.
