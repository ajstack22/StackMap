# Project Coding Conventions - Node.js + Express

This is an example conventions file for a Node.js + Express backend project.

## Naming Conventions

### Files
- Routes: kebab-case (e.g., `user-routes.js`)
- Controllers: kebab-case (e.g., `user-controller.js`)
- Models: PascalCase (e.g., `User.js`)
- Services: kebab-case (e.g., `auth-service.js`)
- Middleware: kebab-case (e.g., `auth-middleware.js`)
- Tests: Same as source with `.test` suffix (e.g., `user-controller.test.js`)

### Code
- Functions: camelCase (e.g., `getUserById`)
- Classes: PascalCase (e.g., `UserService`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- Routes: kebab-case (e.g., `/api/users/:user-id`)
- Database tables: snake_case (e.g., `user_profiles`)

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── validators/     # Input validation
└── app.js          # Express app setup

tests/
├── integration/    # Integration tests
└── unit/           # Unit tests

scripts/
├── migrations/     # Database migrations
└── seeds/          # Database seeds
```

## API Design

### RESTful Routes
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Use plural nouns for resources (e.g., `/users` not `/user`)
- Use kebab-case for multi-word resources (e.g., `/user-profiles`)
- Use nesting for relationships (e.g., `/users/:id/posts`)

```javascript
// ✅ Good: RESTful routes
GET    /api/v1/users          # List users
GET    /api/v1/users/:id      # Get user
POST   /api/v1/users          # Create user
PUT    /api/v1/users/:id      # Update user (full)
PATCH  /api/v1/users/:id      # Update user (partial)
DELETE /api/v1/users/:id      # Delete user

// ❌ Bad: Non-RESTful
GET    /api/v1/getUser
POST   /api/v1/createUser
POST   /api/v1/deleteUser
```

### Versioning
- Always version your API (e.g., `/api/v1`)
- Use URL versioning (not headers)
- Document breaking changes

### Response Format
- Consistent response structure
- Use proper status codes
- Include error details

```javascript
// ✅ Good: Consistent response format
// Success response
{
  "success": true,
  "data": { /* user object */ }
}

// Error response
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 123 not found",
    "details": { /* optional additional info */ }
  }
}

// Paginated response
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Request Handling

### Controller Pattern
- Keep controllers thin (delegate to services)
- Handle HTTP concerns only (request/response)
- Validate input in controllers
- Don't put business logic in controllers

```javascript
// ✅ Good: Thin controller
async function getUser(req, res, next) {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

// ❌ Bad: Business logic in controller
async function getUser(req, res, next) {
  try {
    const { id } = req.params
    // Complex database queries here
    // Data transformations here
    // Business rules here
  } catch (error) {
    next(error)
  }
}
```

### Service Layer
- Business logic goes in services
- Services are reusable across routes
- Services don't know about HTTP (no req/res)
- Return data or throw errors

```javascript
// ✅ Good: Service with business logic
class UserService {
  async getUserById(id) {
    const user = await User.findById(id)

    if (!user) {
      throw new NotFoundError(`User ${id} not found`)
    }

    // Business logic: Apply privacy rules
    if (user.isPrivate) {
      return this.sanitizePrivateUser(user)
    }

    return user
  }

  sanitizePrivateUser(user) {
    const { password, email, ...publicData } = user
    return publicData
  }
}
```

## Error Handling

### Error Classes
- Use custom error classes
- Include error codes
- Don't expose internal errors to clients

```javascript
// ✅ Good: Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404, 'NOT_FOUND')
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

// Usage
throw new NotFoundError('User not found')
```

### Error Middleware
- Use centralized error handler
- Log errors with context
- Don't leak sensitive info

```javascript
// ✅ Good: Centralized error handler
function errorHandler(err, req, res, next) {
  // Log error with context
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id
  })

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    })
  }

  // Programming errors (unexpected) - don't expose details
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  })
}

app.use(errorHandler)
```

### Async Error Handling
- Use async/await (not callbacks)
- Wrap async routes in error handler
- Don't use .catch() inline

```javascript
// ✅ Good: Async wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Usage
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id)
  res.json({ success: true, data: user })
}))

// ❌ Bad: Manual try/catch everywhere
router.get('/users/:id', async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id)
    res.json({ success: true, data: user })
  } catch (error) {
    // Error handling repeated in every route
  }
})
```

## Security

### Authentication
- Use JWT tokens (not sessions for stateless API)
- Store tokens in httpOnly cookies
- Implement refresh token rotation
- Never store passwords in plain text

```javascript
// ✅ Good: JWT with httpOnly cookie
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  })
}
```

### Authorization
- Check permissions server-side (not client-side)
- Use middleware for auth checks
- Implement role-based access control (RBAC)

```javascript
// ✅ Good: Authorization middleware
function requireAuth(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    throw new UnauthorizedError('Authentication required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    throw new UnauthorizedError('Invalid token')
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions')
    }
    next()
  }
}

// Usage
router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser)
```

### Input Validation
- Validate all input
- Sanitize user input
- Use validation libraries (Joi, express-validator)

```javascript
// ✅ Good: Input validation with Joi
const Joi = require('joi')

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required()
})

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body)

    if (error) {
      throw new ValidationError('Invalid input', error.details)
    }

    req.body = value // Use validated/sanitized data
    next()
  }
}

// Usage
router.post('/users', validateBody(createUserSchema), createUser)
```

### Rate Limiting
- Implement rate limiting on all routes
- Stricter limits on auth routes
- Use Redis for distributed rate limiting

```javascript
// ✅ Good: Rate limiting
const rateLimit = require('express-rate-limit')

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // 5 login attempts per window
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)
```

### SQL Injection Prevention
- Always use parameterized queries
- Never concatenate user input into SQL
- Use ORM/query builder (Sequelize, Knex)

```javascript
// ✅ Good: Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [email]
)

// ❌ Bad: SQL injection vulnerable
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
)
```

## Database

### Models
- Use ORM (Sequelize, TypeORM, Prisma)
- Define relationships clearly
- Add indexes for frequently queried fields

```javascript
// ✅ Good: Sequelize model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  indexes: [{ unique: true, fields: ['email'] }]
})
```

### Migrations
- Use migrations for schema changes
- Never modify old migrations
- Test migrations on staging before production

```javascript
// ✅ Good: Migration file
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'phone')
  }
}
```

### Query Optimization
- Use indexes for WHERE clauses
- Avoid N+1 queries (use eager loading)
- Add LIMIT to queries
- Use pagination for large datasets

```javascript
// ✅ Good: Eager loading (avoids N+1)
const users = await User.findAll({
  include: [{ model: Post }],
  limit: 20
})

// ❌ Bad: N+1 query problem
const users = await User.findAll()
for (const user of users) {
  const posts = await Post.findAll({ where: { userId: user.id } })
}
```

## Testing

### Test Organization
- Unit tests: Test services in isolation
- Integration tests: Test API endpoints
- Use describe/test blocks
- Follow Arrange-Act-Assert pattern

### Coverage Requirements
- Minimum: 80% coverage
- 100% for critical paths (auth, payments)
- Test happy path + error cases + edge cases

### Test Patterns
```javascript
// ✅ Good: Integration test
describe('GET /api/v1/users/:id', () => {
  describe('when user exists', () => {
    test('should return user data', async () => {
      // Arrange
      const user = await createTestUser()

      // Act
      const response = await request(app)
        .get(`/api/v1/users/${user.id}`)
        .expect(200)

      // Assert
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(user.id)
    })
  })

  describe('when user does not exist', () => {
    test('should return 404', async () => {
      const response = await request(app)
        .get('/api/v1/users/nonexistent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('USER_NOT_FOUND')
    })
  })
})
```

### Mocking
- Mock external services (emails, payments)
- Use test database (not production)
- Clean up test data after each test

## Logging

### Log Levels
- error: Errors requiring immediate attention
- warn: Warnings that should be reviewed
- info: Important application events
- debug: Detailed information for debugging

### What to Log
```javascript
// ✅ Good: Structured logging
logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date(),
  ip: req.ip
})

logger.error('Payment failed', {
  userId: user.id,
  amount: payment.amount,
  error: error.message,
  stack: error.stack
})

// ❌ Bad: No context
logger.info('User logged in')
logger.error('Error:', error)
```

### What NOT to Log
- Passwords
- Credit card numbers
- Personal identifiable information (PII)
- Full request/response bodies

## Environment Configuration

### Environment Variables
- Use .env files (never commit to git)
- Provide .env.example template
- Validate required env vars on startup

```javascript
// ✅ Good: Validate config on startup
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`)
  }
}

// Export config object
module.exports = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  }
}
```

## Documentation

### Code Comments
- JSDoc for public APIs
- Comments for complex logic
- Explain WHY, not WHAT

```javascript
/**
 * Generates a password reset token for the user.
 * Token expires after 1 hour to limit security window.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} The reset token
 */
async function generateResetToken(userId) {
  // Implementation
}
```

### API Documentation
- Use OpenAPI/Swagger
- Document all endpoints
- Include request/response examples

## Git Workflow

### Commit Messages
- Format: `type(scope): message`
- Types: feat, fix, docs, refactor, test, chore
- Keep commits atomic

```bash
# ✅ Good
feat(auth): add password reset endpoint
fix(users): handle null email gracefully
docs(api): update authentication docs

# ❌ Bad
Updated stuff
Fixed bug
Changes
```

## Performance

### Response Time
- Target: < 200ms for API responses
- Use caching where appropriate
- Optimize database queries
- Use indexes

### Caching
- Cache frequently accessed data
- Use Redis for caching
- Set appropriate TTL values

```javascript
// ✅ Good: Redis caching
async function getUserById(id) {
  const cacheKey = `user:${id}`

  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Cache miss - fetch from database
  const user = await User.findById(id)

  // Store in cache (TTL: 5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(user))

  return user
}
```

## Monitoring

### Health Checks
- Implement /health endpoint
- Check database connectivity
- Check external service connectivity

```javascript
// ✅ Good: Health check endpoint
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    checks: {
      database: 'ok',
      redis: 'ok'
    }
  }

  try {
    await sequelize.authenticate()
  } catch (error) {
    health.status = 'error'
    health.checks.database = 'error'
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health)
})
```

### Metrics
- Track request count
- Track response times
- Track error rates
- Use APM tool (New Relic, DataDog)

## Enforcement

These conventions are enforced by:
1. ESLint (automated)
2. Tests (automated)
3. Peer review (manual)
4. Atlas peer-reviewer agent (automated)

Violations of critical conventions will result in PR rejection.
