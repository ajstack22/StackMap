# StackMap Dev API Deployment Guide

This guide provides comprehensive instructions for deploying the StackMap Dev API Infrastructure in production environments.

## 🎯 Deployment Overview

The StackMap Dev API is designed for high availability and scalability with the following architecture:
- **Load Balancer** → **API Servers** → **Database Pool** + **Redis Cluster**
- **Monitoring Stack**: Prometheus + Grafana + AlertManager
- **Logging Stack**: ELK (Elasticsearch + Logstash + Kibana)

## 🏗️ Infrastructure Requirements

### Minimum System Requirements

#### API Server (per instance)
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 1 Gbps

#### Database Server
- **CPU**: 4 vCPUs
- **RAM**: 8 GB
- **Storage**: 100 GB SSD (with IOPS provisioning)
- **Network**: 10 Gbps

#### Redis Server
- **CPU**: 2 vCPUs
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: 1 Gbps

### Recommended Production Setup

#### High Availability Configuration
- **API Servers**: 3+ instances behind load balancer
- **Database**: Primary + 2 read replicas
- **Redis**: 3-node cluster with sentinel
- **Load Balancer**: HAProxy or AWS ALB
- **Monitoring**: Dedicated monitoring stack

## 🚀 Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### 1. Prepare Docker Environment

Create the deployment directory structure:
```bash
mkdir -p /opt/stackmap-dev-api/{config,logs,data}
cd /opt/stackmap-dev-api
```

#### 2. Create Docker Compose Configuration

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  api:
    image: stackmap/dev-api:latest
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DB_HOST: database
      REDIS_HOST: redis
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    depends_on:
      - database
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/dev/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1'

  database:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
      - ./config/mysql.cnf:/etc/mysql/conf.d/custom.cnf
    ports:
      - "3306:3306"
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  db_data:
  redis_data:
```

#### 3. Environment Configuration

**.env.production**:
```env
# Application
NODE_ENV=production
DEV_API_PORT=3001

# Database
DB_HOST=database
DB_PORT=3306
DB_USER=stackmap_api
DB_PASSWORD=secure_db_password_here
DB_NAME=stackmap_dev_api
DB_ROOT_PASSWORD=secure_root_password_here
DB_POOL_SIZE=20

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password_here
REDIS_DB=0

# Security
JWT_SECRET=ultra_secure_jwt_secret_key_256_bits
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Monitoring
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
ENABLE_STRUCTURED_LOGGING=true

# Performance
REDIS_KEY_PREFIX=stackmap:dev:prod:
```

#### 4. Deploy with Docker Compose

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
```

### Method 2: Kubernetes Deployment

#### 1. Create Kubernetes Manifests

**namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: stackmap-dev-api
```

**configmap.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: stackmap-dev-api
data:
  NODE_ENV: "production"
  DEV_API_PORT: "3001"
  LOG_LEVEL: "info"
```

**secret.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
  namespace: stackmap-dev-api
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  REDIS_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
```

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stackmap-dev-api
  namespace: stackmap-dev-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stackmap-dev-api
  template:
    metadata:
      labels:
        app: stackmap-dev-api
    spec:
      containers:
      - name: api
        image: stackmap/dev-api:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: api-config
        - secretRef:
            name: api-secrets
        livenessProbe:
          httpGet:
            path: /api/dev/v1/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/dev/v1/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
```

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: stackmap-dev-api-service
  namespace: stackmap-dev-api
spec:
  selector:
    app: stackmap-dev-api
  ports:
  - port: 80
    targetPort: 3001
  type: LoadBalancer
```

#### 2. Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check deployment status
kubectl get pods -n stackmap-dev-api
kubectl get services -n stackmap-dev-api

# View logs
kubectl logs -f deployment/stackmap-dev-api -n stackmap-dev-api
```

### Method 3: Traditional Server Deployment

#### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash stackmap
sudo usermod -aG sudo stackmap
```

#### 2. Application Setup

```bash
# Switch to application user
sudo su - stackmap

# Create application directory
mkdir -p /home/stackmap/stackmap-dev-api
cd /home/stackmap/stackmap-dev-api

# Clone repository or copy files
git clone <repository-url> .

# Install dependencies
npm ci --production

# Create logs directory
mkdir -p logs

# Set up environment
cp .env.example .env.production
# Edit .env.production with production values
```

#### 3. PM2 Configuration

**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'stackmap-dev-api',
    script: './src/services/api/dev/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048'
  }]
};
```

#### 4. Start Services

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u stackmap --hp /home/stackmap
```

## 🔧 Configuration

### Database Configuration

**MySQL Configuration** (`/etc/mysql/mysql.conf.d/stackmap.cnf`):
```ini
[mysqld]
# Connection settings
max_connections = 200
max_connect_errors = 1000000

# Buffer pool settings
innodb_buffer_pool_size = 6G
innodb_buffer_pool_instances = 6

# Log settings
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1

# Performance settings
innodb_flush_log_at_trx_commit = 1
sync_binlog = 1
innodb_io_capacity = 2000
innodb_io_capacity_max = 4000

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

### Redis Configuration

**Redis Configuration** (`redis.conf`):
```ini
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Memory
maxmemory 3gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your_secure_redis_password

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### Nginx Configuration

**Nginx Configuration** (`nginx.conf`):
```nginx
upstream stackmap_api {
    least_conn;
    server api:3001 max_fails=3 fail_timeout=30s;
    server api:3002 max_fails=3 fail_timeout=30s;
    server api:3003 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.stackmap.dev;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.stackmap.dev;

    ssl_certificate /etc/nginx/ssl/stackmap.crt;
    ssl_certificate_key /etc/nginx/ssl/stackmap.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/json text/plain application/javascript;

    location / {
        proxy_pass http://stackmap_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        access_log off;
        proxy_pass http://stackmap_api;
    }
}
```

## 📊 Monitoring Setup

### Prometheus Configuration

**prometheus.yml**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "stackmap_rules.yml"

scrape_configs:
  - job_name: 'stackmap-dev-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/api/dev/v1/health/prometheus'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboard

**StackMap Dev API Dashboard** (JSON):
```json
{
  "dashboard": {
    "title": "StackMap Dev API",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(stackmap_api_request_duration_ms_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(stackmap_api_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(stackmap_api_errors_total[5m])",
            "legendFormat": "{{status}}"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Health Checks & Monitoring

### Application Health Checks

```bash
# Basic health check
curl -f http://localhost:3001/api/dev/v1/health

# Detailed health check
curl -f http://localhost:3001/api/dev/v1/health/system

# Database health
curl -f http://localhost:3001/api/dev/v1/health/database

# Redis health
curl -f http://localhost:3001/api/dev/v1/health/redis
```

### Load Balancer Health Check

Configure your load balancer to use:
- **Health Check URL**: `/api/dev/v1/health`
- **Expected Response**: 200 OK
- **Check Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

## 🚨 Alerting Rules

### Prometheus Alerting Rules

**stackmap_rules.yml**:
```yaml
groups:
  - name: stackmap_dev_api
    rules:
      - alert: APIHighErrorRate
        expr: rate(stackmap_api_errors_total[5m]) / rate(stackmap_api_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: APIHighResponseTime
        expr: histogram_quantile(0.95, rate(stackmap_api_request_duration_ms_bucket[5m])) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}ms"

      - alert: APIDown
        expr: up{job="stackmap-dev-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "API is down"
          description: "StackMap Dev API is not responding"

      - alert: DatabaseConnectionFailure
        expr: stackmap_dev_api_health{component="database"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Cannot connect to database"

      - alert: RedisConnectionFailure
        expr: stackmap_dev_api_health{component="redis"} == 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Redis connection failure"
          description: "Cannot connect to Redis cache"
```

## 🔐 Security Hardening

### SSL/TLS Configuration

1. **Obtain SSL Certificate**:
```bash
# Using Let's Encrypt
sudo certbot certonly --nginx -d api.stackmap.dev
```

2. **Configure Strong SSL Settings**:
```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

### Firewall Configuration

```bash
# UFW firewall rules
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow from 10.0.0.0/8 to any port 3001  # Internal API access
```

### Security Headers

The API automatically includes security headers via Helmet.js:
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=31536000; includeSubDomains
- **Content-Security-Policy**: Restrictive policy

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured and secured
- [ ] Database initialized with proper user permissions
- [ ] Redis configured with authentication
- [ ] SSL certificates installed and validated
- [ ] Firewall rules configured
- [ ] Monitoring stack deployed and configured
- [ ] Backup procedures implemented
- [ ] Load balancer health checks configured

### Deployment
- [ ] API application deployed and started
- [ ] Health checks passing
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] Load balancer routing correctly
- [ ] SSL termination working
- [ ] Monitoring dashboards showing data
- [ ] Log aggregation functioning

### Post-Deployment
- [ ] Full API test suite executed
- [ ] Performance benchmarks validated
- [ ] Security scan completed
- [ ] Monitoring alerts configured and tested
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Rollback procedure tested

## 🔄 Backup & Recovery

### Database Backup

**Automated Backup Script**:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="stackmap_dev_api"

mkdir -p $BACKUP_DIR

# Full backup
mysqldump --single-transaction --routines --triggers \
  -u root -p$DB_ROOT_PASSWORD $DB_NAME > \
  $BACKUP_DIR/stackmap_dev_api_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/stackmap_dev_api_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Redis Backup

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Copy Redis data
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Compress backup
gzip $BACKUP_DIR/redis_$DATE.rdb
```

### Application Backup

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/stackmap_dev_api_$DATE.tar.gz \
  /opt/stackmap-dev-api \
  --exclude=node_modules \
  --exclude=logs

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  /etc/nginx/sites-available/stackmap \
  /etc/systemd/system/stackmap-dev-api.service
```

## 🚀 Scaling & Performance Optimization

### Horizontal Scaling

1. **Add API Instances**:
   - Deploy additional API servers
   - Update load balancer configuration
   - Monitor resource utilization

2. **Database Scaling**:
   - Configure read replicas
   - Implement read/write splitting
   - Optimize query performance

3. **Redis Scaling**:
   - Setup Redis cluster
   - Configure Redis Sentinel for failover
   - Implement cache partitioning

### Performance Optimization

1. **Database Optimization**:
```sql
-- Add indexes for common queries
CREATE INDEX idx_sync_activities_sync_id ON sync_activities(sync_id);
CREATE INDEX idx_sync_activities_created_at ON sync_activities(created_at);
CREATE INDEX idx_dev_api_metrics_timestamp ON dev_api_metrics(timestamp);

-- Optimize slow queries
ANALYZE TABLE sync_activities;
OPTIMIZE TABLE dev_api_metrics;
```

2. **Redis Optimization**:
```ini
# Memory optimization
maxmemory-policy allkeys-lru
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# Network optimization
tcp-keepalive 300
timeout 0
```

3. **Application Optimization**:
   - Enable HTTP/2 in Nginx
   - Implement CDN for static assets
   - Optimize database queries
   - Tune garbage collection settings

## 📞 Support & Troubleshooting

### Common Issues

1. **High Memory Usage**:
   - Check Node.js heap size settings
   - Monitor Redis memory usage
   - Review database buffer pool size

2. **Slow Database Queries**:
   - Enable slow query log
   - Add missing indexes
   - Optimize complex queries

3. **Redis Connection Issues**:
   - Check Redis server status
   - Verify authentication credentials
   - Monitor connection pool usage

### Log Analysis

```bash
# API application logs
tail -f /opt/stackmap-dev-api/logs/dev-api-$(date +%Y-%m-%d).log

# Nginx access logs
tail -f /var/log/nginx/access.log | grep stackmap

# Database slow query log
tail -f /var/log/mysql/slow.log

# Redis logs
tail -f /var/log/redis/redis-server.log
```

### Performance Monitoring

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/dev/v1/health

# Monitor system resources
htop
iotop
netstat -tulpn
```

---

This deployment guide provides comprehensive instructions for deploying the StackMap Dev API Infrastructure in production environments. Follow the checklists and monitor the specified metrics to ensure optimal performance and reliability.

For additional support, refer to the main README.md or contact the development team.