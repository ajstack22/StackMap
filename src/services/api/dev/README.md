# StackMap Dev API Infrastructure

A comprehensive RESTful API for StackMap development and monitoring, providing endpoints for health checks, sync monitoring, analytics, and administrative functions.

## 🚀 Features

- **Health Monitoring**: System, database, and Redis health checks
- **Sync Monitoring**: Real-time sync status, diagnostics, and audit logs
- **Analytics**: API usage, performance metrics, and user behavior analysis
- **Development Tools**: Test data generation, debugging utilities
- **Admin Functions**: System metrics, configuration management, maintenance mode
- **Security**: JWT authentication, rate limiting, input validation
- **Performance**: Redis caching, connection pooling, <500ms response times
- **Monitoring**: Comprehensive logging, metrics collection, Prometheus support

## 📋 API Endpoints

### Health Endpoints (Public)
```
GET  /api/dev/v1/health                    # Basic health check
GET  /api/dev/v1/health/system             # Detailed system health
GET  /api/dev/v1/health/database           # Database health
GET  /api/dev/v1/health/redis              # Redis health
GET  /api/dev/v1/health/metrics            # Metrics health
GET  /api/dev/v1/health/dependencies       # External dependencies
GET  /api/dev/v1/health/detailed           # Comprehensive health report
GET  /api/dev/v1/health/prometheus         # Prometheus metrics format
```

### Sync Monitoring (Requires 'read' permission)
```
GET  /api/dev/v1/sync/status/:syncId       # Sync group status
GET  /api/dev/v1/sync/stats                # Global sync statistics
GET  /api/dev/v1/sync/diagnostics/:syncId  # Sync diagnostics
GET  /api/dev/v1/sync/audit                # Sync audit logs
GET  /api/dev/v1/sync/errors               # Error analysis
GET  /api/dev/v1/sync/performance          # Performance metrics
GET  /api/dev/v1/sync/active               # Active operations
GET  /api/dev/v1/sync/summary              # System summary
POST /api/dev/v1/sync/test/:syncId         # Test connectivity (requires 'write')
```

### Analytics (Requires 'read' permission)
```
GET  /api/dev/v1/analytics/usage           # API usage analytics
GET  /api/dev/v1/analytics/performance     # Performance analytics
GET  /api/dev/v1/analytics/users/:userId   # User analytics
```

### Development Tools (Requires 'write' permission)
```
POST /api/dev/v1/dev/test-data             # Generate test data
GET  /api/dev/v1/dev/debug                 # Debug information
```

### Admin Functions (Requires 'admin' permission)
```
GET  /api/dev/v1/admin/metrics             # System metrics
PUT  /api/dev/v1/admin/config              # Update configuration
POST /api/dev/v1/admin/maintenance         # Maintenance mode
```

## 🔐 Authentication & Authorization

### JWT Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

### User Roles & Permissions
- **admin**: Full access (read, write, admin, delete)
- **developer**: Read and write access
- **readonly**: Read-only access

### Rate Limiting
- **Global**: 1000 requests per 15 minutes per IP
- **Read operations**: 100 requests per minute
- **Write operations**: 20 requests per minute
- **Admin operations**: 10 requests per 5 minutes
- **Auth attempts**: 5 attempts per 15 minutes

## 📊 Performance Requirements

- **Health endpoints**: <100ms response time
- **Data endpoints**: <500ms response time
- **Concurrent requests**: Handle 100 simultaneous requests
- **Uptime**: 99.9% availability target

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production
DEV_API_PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=stackmap
DB_PASSWORD=your_password
DB_NAME=stackmap_dev
DB_POOL_SIZE=10

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_ISSUER=stackmap-dev-api
JWT_AUDIENCE=stackmap-developers

# Security Configuration
BCRYPT_ROUNDS=12
DEFAULT_USER_ROLE=developer

# Logging Configuration
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
LOG_DIR=./logs

# Cache Configuration
REDIS_KEY_PREFIX=stackmap:dev:
```

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize Database**
```bash
# Database tables are auto-created on first run
# Ensure MySQL is running and accessible
```

4. **Start the Server**
```bash
# Development
npm run dev:api

# Production
npm run start:api
```

### Docker Deployment
```bash
# Build image
docker build -t stackmap-dev-api .

# Run with docker-compose
docker-compose up -d
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Security tests
npm run test:security

# Coverage report
npm run test:coverage
```

### Test Configuration
- **Unit tests**: Jest with mocked dependencies
- **Integration tests**: Supertest with test database
- **Security tests**: Vulnerability scanning and penetration testing
- **Performance tests**: Load testing with 100 concurrent requests

## 📈 Monitoring & Observability

### Logging
- **Structured JSON logging** with metadata
- **Multiple log levels**: error, warn, info, debug
- **Request/response logging** with performance metrics
- **Security event logging** and audit trails
- **Log rotation** and cleanup

### Metrics Collection
- **API performance metrics**: response times, error rates, throughput
- **System metrics**: CPU, memory, disk usage
- **Database metrics**: connection pool, query performance
- **Redis metrics**: cache hit rates, operation latencies
- **Custom business metrics**: sync operations, user activity

### Health Checks
- **Load balancer health checks**: `/api/dev/v1/health`
- **Detailed health monitoring**: `/api/dev/v1/health/system`
- **Prometheus metrics**: `/api/dev/v1/health/prometheus`
- **Dependency monitoring**: External service health checks

## 🔒 Security Features

### Input Validation
- **Joi schema validation** for all inputs
- **SQL injection prevention** through parameterized queries
- **XSS protection** with input sanitization
- **Path traversal protection**

### Authentication & Authorization
- **JWT token validation** with configurable expiration
- **Role-based access control** (RBAC)
- **Permission-based endpoint protection**
- **Token refresh mechanism**

### Security Headers
- **Helmet.js** for security headers
- **CORS** configuration
- **Content Security Policy** (CSP)
- **HTTP Strict Transport Security** (HSTS)

### Audit & Monitoring
- **Security event logging**
- **Failed authentication tracking**
- **Suspicious activity detection**
- **Rate limiting with Redis backend**

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database initialized and migrated
- [ ] Redis cluster configured
- [ ] SSL certificates installed
- [ ] Monitoring dashboards configured
- [ ] Log aggregation setup
- [ ] Backup procedures verified

### Scaling Considerations
- **Horizontal scaling**: Load balancer with multiple API instances
- **Database scaling**: Read replicas, connection pooling
- **Redis scaling**: Cluster mode for high availability
- **CDN**: Static asset delivery optimization

### Maintenance
- **Log rotation**: Automatic cleanup of old log files
- **Database maintenance**: Regular OPTIMIZE TABLE operations
- **Redis maintenance**: Memory usage monitoring and cleanup
- **Security updates**: Regular dependency updates

## 📚 API Usage Examples

### Health Check
```bash
curl -X GET http://localhost:3001/api/dev/v1/health
```

### Get Sync Status (with auth)
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/dev/v1/sync/status/abc123def456...
```

### Get System Metrics (admin only)
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  http://localhost:3001/api/dev/v1/admin/metrics
```

## 🤝 Contributing

1. **Code Style**: Follow ESLint configuration
2. **Testing**: Maintain >80% test coverage
3. **Documentation**: Update API docs for new endpoints
4. **Security**: Follow secure coding practices
5. **Performance**: Meet response time requirements

## 📄 License

This project is part of the StackMap application and follows the same licensing terms.

## 🆘 Support

For issues and support:
- Check the troubleshooting guide in `/docs/troubleshooting.md`
- Review logs in the configured log directory
- Monitor health endpoints for system status
- Contact the development team for escalation

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintainer**: StackMap Development Team