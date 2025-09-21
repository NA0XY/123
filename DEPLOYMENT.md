# OneCare - Production Deployment Guide

## 🚀 Production Deployment Overview

This guide provides step-by-step instructions for deploying OneCare in production environments, including cloud deployment, security configurations, monitoring setup, and maintenance procedures.

## 📋 Prerequisites

### System Requirements
- **Server**: Linux/Windows Server with minimum 4GB RAM, 2 CPU cores
- **Node.js**: Version 16.x or higher
- **Database**: PostgreSQL 12+ or MongoDB 4.4+ (optional, currently using in-memory storage)
- **Web Server**: Nginx or Apache for reverse proxy
- **SSL Certificate**: Valid SSL certificate for HTTPS
- **Domain**: Registered domain name

### Dependencies
- **PM2**: Process manager for Node.js applications
- **Docker** (optional): For containerized deployment
- **Redis** (optional): For session storage and caching
- **Load Balancer**: For high-availability deployments

## 🏗️ Architecture Overview

```
Internet
    │
    ├── Load Balancer / CDN
    │       │
    │   ┌───▼───┐
    │   │ Nginx │ (Reverse Proxy & Static Files)
    │   └───┬───┘
    │       │
    ├───────┼───────┬───────────────────────────┐
    │       │       │                           │
┌───▼───┐ │   ┌───▼────┐                  ┌────▼────┐
│Node.js│ │   │Node.js │                  │Node.js  │
│Server │ │   │API     │                  │WebSocket│
│(Main) │ │   │Server  │                  │Server   │
└───────┘ │   └────────┘                  └─────────┘
          │
    ┌─────▼─────┐
    │ Database  │
    │(Optional) │
    └───────────┘
```

## 🔐 Environment Configuration

### 1. Create Production Environment File

Create `/home/onecare/.env` (Linux) or `C:\OneCare\.env` (Windows):

```env
# Application Environment
NODE_ENV=production
PORT=3000
API_PORT=3001
WEBSOCKET_PORT=3002
ANALYTICS_PORT=3003

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-256-bits
SESSION_SECRET=your-session-secret-key
ENCRYPT_KEY=your-encryption-key-32-characters

# Database Configuration (Optional)
DATABASE_URL=postgresql://username:password@localhost:5432/onecare
MONGODB_URL=mongodb://username:password@localhost:27017/onecare
REDIS_URL=redis://localhost:6379

# FHIR Server Configuration
FHIR_SERVER_URL=https://your-fhir-server.org/fhir
FHIR_CLIENT_ID=your-production-client-id
FHIR_CLIENT_SECRET=your-production-client-secret
FHIR_REDIRECT_URI=https://yourdomin.com/callback

# Email Configuration
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password
FROM_EMAIL=OneCare <noreply@yourdomain.com>

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# CORS and Security
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Storage
UPLOAD_PATH=/opt/onecare/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/yourdomain.crt
SSL_KEY_PATH=/etc/ssl/private/yourdomain.key
```

### 2. Secure Environment Variables

```bash
# Set secure permissions
chmod 600 /home/onecare/.env
chown onecare:onecare /home/onecare/.env

# Or use a secrets manager
# AWS Secrets Manager, Azure Key Vault, etc.
```

## 📦 Installation Steps

### Option A: Traditional Server Deployment

#### 1. Create System User
```bash
# Create dedicated user for OneCare
sudo useradd -r -s /bin/bash -m -d /home/onecare onecare
sudo mkdir -p /opt/onecare
sudo chown onecare:onecare /opt/onecare
```

#### 2. Install Application
```bash
# Switch to onecare user
sudo su - onecare

# Clone/copy application files to /opt/onecare
cd /opt/onecare
# Copy your OneCare files here

# Install dependencies
npm install --production
```

#### 3. Install Process Manager
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'onecare-main',
      script: 'backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'onecare-api',
      script: 'api/screening-api.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'onecare-websocket',
      script: 'backend/websocket-server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'onecare-analytics',
      script: 'backend/ai-health-analytics.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      }
    }
  ]
};
EOF

# Start applications
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option B: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --production
RUN cd backend && npm install --production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S onecare -u 1001

# Set permissions
RUN chown -R onecare:nodejs /app
USER onecare

# Expose ports
EXPOSE 3000 3001 3002 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "run", "start-all"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  onecare:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
      - "3002:3002"
      - "3003:3003"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./frontend:/usr/share/nginx/html
    depends_on:
      - onecare
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

#### 3. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f onecare

# Scale services
docker-compose up -d --scale onecare=3
```

## 🌐 Web Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/onecare`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;

# Upstream servers
upstream onecare_app {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s backup;
}

upstream onecare_api {
    least_conn;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s backup;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_session_cache shared:SSL:1m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;";

    # Root directory for static files
    root /opt/onecare/frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://onecare_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Authentication endpoints with stricter limits
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://onecare_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket connections
    location /ws {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Main application
    location / {
        try_files $uri $uri/ @nodeapp;
    }

    location @nodeapp {
        proxy_pass http://onecare_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/onecare /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000:3003/tcp  # Block direct access to Node.js ports
sudo ufw enable

# iptables (CentOS/RHEL)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000:3003 -j DROP
sudo iptables-save > /etc/iptables/rules.v4
```

### 2. System Hardening
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install security tools
sudo apt install -y fail2ban unattended-upgrades

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Enable automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Application Security
```javascript
// Add to backend/server.js for production
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2 pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 2. System Monitoring
```bash
# Install system monitoring
sudo apt install -y htop iotop nethogs

# Setup log monitoring
sudo nano /etc/rsyslog.d/50-onecare.conf
```

Add to rsyslog config:
```
# OneCare application logs
local0.*    /var/log/onecare/application.log
local1.*    /var/log/onecare/error.log
```

### 3. Health Checks
Create `/opt/onecare/health-check.sh`:
```bash
#!/bin/bash

# Health check script
check_service() {
    local service_name=$1
    local port=$2
    local endpoint=${3:-/health}
    
    if curl -f "http://localhost:${port}${endpoint}" > /dev/null 2>&1; then
        echo "✅ $service_name is healthy"
        return 0
    else
        echo "❌ $service_name is unhealthy"
        return 1
    fi
}

# Check all services
check_service "Main Application" 3000
check_service "API Server" 3001
check_service "WebSocket Server" 3002
check_service "Analytics Service" 3003
```

### 4. Automated Backup
Create `/opt/onecare/backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/backup/onecare"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup application files
tar -czf "$BACKUP_DIR/$DATE/app-$DATE.tar.gz" -C /opt onecare

# Backup logs
cp -r /opt/onecare/logs "$BACKUP_DIR/$DATE/"

# Backup configuration
cp /home/onecare/.env "$BACKUP_DIR/$DATE/"

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$DATE"
```

## 🚀 Deployment Automation

### 1. Deployment Script
Create `/opt/onecare/deploy.sh`:
```bash
#!/bin/bash

set -e

echo "🚀 Starting OneCare deployment..."

# Variables
APP_DIR="/opt/onecare"
BACKUP_DIR="/backup/onecare"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/pre-deploy-$DATE.tar.gz" -C /opt onecare

# Stop services
echo "🛑 Stopping services..."
pm2 stop all

# Update application
echo "📥 Updating application..."
cd "$APP_DIR"
git pull origin main  # or copy new files

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run migrations (if using database)
# npm run migrate

# Start services
echo "🚀 Starting services..."
pm2 start ecosystem.config.js
pm2 save

# Health check
sleep 10
echo "🏥 Running health checks..."
./health-check.sh

echo "✅ Deployment completed successfully!"
```

### 2. CI/CD Pipeline (GitHub Actions)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.6
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/onecare
          sudo -u onecare ./deploy.sh
```

## 🔧 Maintenance Tasks

### Daily Tasks
- Monitor application logs
- Check system resources
- Verify health checks

### Weekly Tasks
- Review security logs
- Update system packages
- Monitor disk usage
- Check backup integrity

### Monthly Tasks
- Security audit
- Performance review
- Update dependencies
- Review access logs

### Maintenance Scripts
Create `/opt/onecare/maintenance.sh`:
```bash
#!/bin/bash

# System maintenance script
echo "🔧 Starting maintenance tasks..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean logs older than 30 days
find /opt/onecare/logs -name "*.log" -mtime +30 -delete

# Restart services if needed
if pm2 list | grep -q "stopped"; then
    pm2 resurrect
fi

# Check disk usage
df -h /opt/onecare

echo "✅ Maintenance completed!"
```

## 📞 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
pm2 logs onecare-main

# Check port availability
netstat -tulpn | grep :3000

# Check environment variables
pm2 env 0
```

#### High Memory Usage
```bash
# Monitor memory
pm2 monit

# Restart specific service
pm2 restart onecare-main

# Check for memory leaks
node --inspect backend/server.js
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/ssl/certs/yourdomain.crt -text -noout

# Test SSL configuration
nginx -t
```

#### Database Connection Issues
```bash
# Test database connectivity
npm run db:test

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

### Emergency Procedures

#### Service Recovery
```bash
# Full service restart
pm2 restart all
pm2 save

# Rollback to previous version
cd /opt/onecare
git checkout HEAD~1
npm install --production
pm2 restart all
```

#### Database Recovery
```bash
# Restore from backup
psql -U onecare -d onecare < /backup/onecare/latest/database.sql
```

## 📈 Performance Optimization

### 1. Application Optimization
- Enable clustering with PM2
- Use Redis for session storage
- Implement connection pooling
- Optimize database queries
- Use CDN for static assets

### 2. Server Optimization
```bash
# Optimize nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 30;
client_max_body_size 10M;

# System optimization
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'net.ipv4.tcp_max_syn_backlog = 65535' >> /etc/sysctl.conf
sysctl -p
```

## 🔐 Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Firewall rules configured
- [ ] Regular security updates enabled
- [ ] Strong passwords and JWT secrets
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security audits scheduled
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintained by**: OneCare Development Team