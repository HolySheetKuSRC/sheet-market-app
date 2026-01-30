# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-01-30

### Security
- **CRITICAL**: Updated `aiohttp` from 3.9.1 to 3.13.3
  - Fixes zip bomb vulnerability (CVE: affects <= 3.13.2)
  - Fixes DoS vulnerability when parsing malformed POST requests (affects < 3.9.4)
  - Fixes directory traversal vulnerability (affects >= 1.0.5, < 3.9.2)
  
- **CRITICAL**: Updated `python-multipart` from 0.0.6 to 0.0.22
  - Fixes arbitrary file write vulnerability (affects < 0.0.22)
  - Fixes DoS via deformed multipart/form-data boundary (affects < 0.0.18)
  - Fixes Content-Type Header ReDoS vulnerability (affects <= 0.0.6)
  
- **HIGH**: Updated `fastapi` from 0.104.1 to 0.115.6
  - Fixes Content-Type Header ReDoS vulnerability (affects <= 0.109.0)

### Changed
- Updated `uvicorn` from 0.24.0 to 0.32.1
- Updated `pydantic` from 2.5.0 to 2.10.6
- Updated `pydantic-settings` from 2.1.0 to 2.7.1
- Updated `celery` from 5.3.4 to 5.4.0
- Updated `redis` from 5.0.1 to 5.3.1
- Updated `sqlalchemy` from 2.0.23 to 2.0.36
- Updated `asyncpg` from 0.29.0 to 0.30.0
- Updated `alembic` from 1.12.1 to 1.14.0
- Updated `psycopg2-binary` from 2.9.9 to 2.9.10
- Updated `httpx` from 0.25.2 to 0.28.1
- Updated `aiofiles` from 23.2.1 to 24.1.0

### Verified
- All 6 unit tests pass with updated dependencies
- Application validation successful
- No breaking changes detected

## [1.0.0] - 2026-01-30

### Added
- Initial release of FastAPI microservice for PDF OCR processing
- Typhoon OCR API integration with rate limiting (2 RPS)
- Celery task queue for asynchronous processing
- PostgreSQL database for job tracking
- Webhook callbacks with retry logic
- PDF file handling with validation and security
- Docker and Docker Compose support
- Comprehensive documentation (README, QUICKSTART, SECURITY)
- Unit tests for core functionality
- SSRF protection for webhook URLs
- Filename sanitization against directory traversal
- Environment-based CORS configuration
- Async file operations with aiofiles
