# Django Backend Project Conventions

## Project Overview
- Name: Django API Service
- Stack: Django 4.2, Django REST Framework, PostgreSQL, Redis
- Architecture: Modular apps with service layer pattern

## Code Style
- Follow PEP 8 strictly
- Line length: 88 characters (Black formatter)
- Imports: Grouped (stdlib, third-party, local) with isort
- Type hints: Required for all public functions and methods
- Docstrings: Google style for all classes and public functions

## Naming Conventions
- Models: PascalCase, singular (e.g., `UserProfile`, `Article`)
- Views: snake_case for functions, PascalCase for classes (e.g., `get_user_profile`, `UserProfileView`)
- ViewSets: PascalCase with ViewSet suffix (e.g., `UserViewSet`)
- Serializers: PascalCase with Serializer suffix (e.g., `UserSerializer`)
- URLs: kebab-case (e.g., `user-profile/`, `article-list/`)
- Variables: snake_case (e.g., `user_data`, `article_count`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_PAGE_SIZE`)
- Private methods: Leading underscore (e.g., `_calculate_total`)

## Project Structure
```
project/
  apps/
    users/
      models.py         # Database models
      serializers.py    # DRF serializers
      views.py          # View functions/classes
      services.py       # Business logic
      tests/
        test_models.py
        test_services.py
        test_views.py
      urls.py           # App URL routing
    articles/
      [same structure]
  core/
    settings/
      base.py
      development.py
      production.py
    urls.py             # Root URL config
    wsgi.py
  utils/                # Shared utilities
  manage.py
```

## Code Organization
- One model per file for complex models
- Business logic in services.py (not views or models)
- Keep views thin (delegate to services)
- Reusable querysets in managers.py
- Constants in constants.py per app

## Database & Models
- Migrations: Always create for model changes, never edit existing migrations
- Queries: Use `select_related()` for ForeignKey, `prefetch_related()` for ManyToMany
- Optimization: Use `only()` and `defer()` to limit fields
- Transactions: Use `atomic()` for multi-step operations
- Indexes: Add for frequently queried fields
- Anti-pattern: N+1 queries (use select_related/prefetch_related)

## API Design (Django REST Framework)
- Authentication: JWT tokens via djangorestframework-simplejwt
- Permissions: Custom permission classes in permissions.py
- Pagination: Required for all list endpoints (PageNumberPagination, page_size=20)
- Versioning: URL versioning (`/api/v1/`, `/api/v2/`)
- Filtering: django-filter for complex filters
- Response format: Standard envelope `{"success": true, "data": {...}, "message": ""}`
- Error format: `{"success": false, "error": {"code": "", "message": "", "details": {}}}`

## Serializers
- Use ModelSerializer when possible
- Validation: Use `validate_<field>()` for field validation
- Complex validation: Use `validate()` method
- Read-only fields: Explicitly mark (created_at, updated_at, id)
- Nested serializers: Use depth=1 or explicit nested serializers
- Anti-pattern: Business logic in serializers (move to services)

## Services Layer
- All business logic goes in services.py
- Service functions are pure functions when possible
- Services handle transactions, not views
- Services return domain objects, not HTTP responses

Example:
```python
# services.py
from django.db import transaction

@transaction.atomic
def create_user_with_profile(user_data: dict, profile_data: dict) -> User:
    """Create user and associated profile in single transaction."""
    user = User.objects.create_user(**user_data)
    UserProfile.objects.create(user=user, **profile_data)
    return user
```

## Testing
- Framework: pytest + pytest-django
- Coverage: 80% minimum
- Test files: `test_*.py` in `tests/` directory per app
- Fixtures: Use pytest fixtures, store in `conftest.py`
- Factory pattern: Use factory_boy for test data
- Test database: Separate test database (auto-created)
- Mock external services: Use responses or VCR.py

Test structure:
```python
# tests/test_services.py
import pytest
from apps.users.services import create_user_with_profile

@pytest.mark.django_db
class TestUserServices:
    def test_create_user_with_profile_success(self, user_factory):
        # Arrange
        user_data = user_factory.build()
        profile_data = {"bio": "Test bio"}

        # Act
        user = create_user_with_profile(user_data, profile_data)

        # Assert
        assert user.profile.bio == "Test bio"
```

## Error Handling
- Use custom exception classes in exceptions.py
- Handle exceptions in views, return appropriate HTTP status
- Log errors with context (user_id, request_id, etc.)
- Never expose stack traces to clients in production
- Use DRF exception handler for consistent error responses

## Security
- CSRF protection: Enabled for all state-changing operations
- SQL injection: Use ORM (never raw SQL without parameterization)
- XSS prevention: Template auto-escaping enabled
- Rate limiting: django-ratelimit on API endpoints
- Authentication: JWT with refresh tokens
- Authorization: Permission classes on all views
- Secrets: Use environment variables (django-environ)
- CORS: Explicitly configure allowed origins

## Performance
- Database queries: Use `select_related()` and `prefetch_related()`
- Caching: Redis for session, API responses, expensive queries
- Background tasks: Celery for async operations
- Query optimization: Use Django Debug Toolbar in development
- Bulk operations: Use `bulk_create()`, `bulk_update()` for multiple objects

## Caching Strategy
```python
# Cache expensive queries
from django.core.cache import cache

def get_popular_articles():
    cache_key = "popular_articles"
    articles = cache.get(cache_key)

    if articles is None:
        articles = Article.objects.filter(
            published=True
        ).order_by('-views')[:10]
        cache.set(cache_key, articles, 60 * 15)  # 15 minutes

    return articles
```

## Background Tasks (Celery)
- Task naming: `app_name.task_name` (e.g., `users.send_welcome_email`)
- Idempotent tasks: Design tasks to be safely retried
- Task timeout: Set reasonable timeout for all tasks
- Error handling: Use retry mechanism for transient failures

## Logging
- Use Python logging module
- Log levels: DEBUG (dev only), INFO (important events), WARNING (potential issues), ERROR (failures)
- Structured logging: Use JSON format in production
- Log context: Include user_id, request_id, correlation_id
- Never log sensitive data: passwords, tokens, PII

## Environment Configuration
- Use django-environ for settings
- Environment files:
  - `.env.development` - Local development
  - `.env.staging` - Staging environment
  - `.env.production` - Production environment
- Never commit `.env` files
- Provide `.env.example` as template

## Deployment
- Changelog file: `CHANGELOG.md` in root
- Version bumping: Manual in `__init__.py`
- Deployment command: `./deploy.sh [staging|production]`
- Environments:
  - Development: Local with SQLite/PostgreSQL
  - Staging: Heroku/AWS with PostgreSQL, Redis
  - Production: AWS/GCP with PostgreSQL, Redis, CDN

## Pre-Deployment Checklist
- [ ] Run tests: `pytest`
- [ ] Check coverage: `pytest --cov=apps --cov-report=term-missing`
- [ ] Run linter: `flake8`
- [ ] Format code: `black . && isort .`
- [ ] Check migrations: `python manage.py makemigrations --check --dry-run`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static: `python manage.py collectstatic --noinput`
- [ ] Update CHANGELOG.md

## Anti-Patterns (AVOID)

### Business Logic in Wrong Place
- ❌ Business logic in views or serializers
- ✅ Business logic in services.py

### N+1 Queries
- ❌ Accessing related objects without select_related/prefetch_related
- ✅ Use select_related() for ForeignKey, prefetch_related() for ManyToMany

### Raw SQL Without Parameterization
- ❌ `User.objects.raw(f"SELECT * FROM users WHERE id = {user_id}")`
- ✅ `User.objects.raw("SELECT * FROM users WHERE id = %s", [user_id])`

### Ignoring Transactions
- ❌ Multiple database operations without transaction
- ✅ Use `@transaction.atomic` for related operations

### Exposing Internal Errors
- ❌ Returning stack traces or internal error messages to clients
- ✅ Return generic error messages, log details server-side

## Quality Gates
- Linting: `flake8` (must pass before commit)
- Formatting: `black` and `isort` (auto-format before commit)
- Type checking: `mypy` (must pass before deployment)
- Testing: `pytest` (80% coverage minimum)
- Security: `bandit` for security issues
- Dependencies: `safety check` for known vulnerabilities

## Examples

### Good Example: Service Layer
```python
# services.py
from django.db import transaction
from typing import List
from .models import Article, Tag

@transaction.atomic
def create_article_with_tags(
    title: str,
    content: str,
    author_id: int,
    tag_names: List[str]
) -> Article:
    """
    Create article with tags in single transaction.

    Args:
        title: Article title
        content: Article content
        author_id: Author user ID
        tag_names: List of tag names

    Returns:
        Created article instance

    Raises:
        User.DoesNotExist: If author doesn't exist
    """
    article = Article.objects.create(
        title=title,
        content=content,
        author_id=author_id
    )

    tags = [Tag.objects.get_or_create(name=name)[0] for name in tag_names]
    article.tags.set(tags)

    return article
```

### Good Example: Optimized Query
```python
# views.py
from django.db.models import Prefetch
from .models import Article, Comment

def get_articles_with_comments():
    """Get articles with comments, optimized."""
    return Article.objects.select_related(
        'author'
    ).prefetch_related(
        Prefetch(
            'comments',
            queryset=Comment.objects.select_related('user').filter(approved=True)
        )
    ).filter(published=True)
```

### Good Example: Custom Exception
```python
# exceptions.py
from rest_framework.exceptions import APIException

class InsufficientFundsError(APIException):
    status_code = 400
    default_detail = 'Insufficient funds for this operation.'
    default_code = 'insufficient_funds'

# services.py
def withdraw_funds(user_id: int, amount: Decimal) -> Transaction:
    user = User.objects.get(id=user_id)

    if user.balance < amount:
        raise InsufficientFundsError()

    user.balance -= amount
    user.save()

    return Transaction.objects.create(
        user=user,
        amount=-amount,
        type='withdrawal'
    )
```

### Bad Example: Business Logic in View
```python
# ❌ WRONG: Business logic in view
from rest_framework.views import APIView

class CreateArticleView(APIView):
    def post(self, request):
        # Don't do this!
        article = Article.objects.create(
            title=request.data['title'],
            content=request.data['content'],
            author=request.user
        )

        for tag_name in request.data.get('tags', []):
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            article.tags.add(tag)

        return Response({'id': article.id})

# ✅ CORRECT: Thin view, delegate to service
class CreateArticleView(APIView):
    def post(self, request):
        serializer = ArticleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = create_article_with_tags(
            title=serializer.validated_data['title'],
            content=serializer.validated_data['content'],
            author_id=request.user.id,
            tag_names=serializer.validated_data.get('tags', [])
        )

        return Response(ArticleSerializer(article).data, status=201)
```
