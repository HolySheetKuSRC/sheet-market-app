# PDF OCR Microservice

A FastAPI-based microservice for processing PDF files using the Typhoon OCR API with asynchronous task processing, webhook callbacks, and rate limiting.

## Features

- **FastAPI REST API** - Modern, fast web framework for building APIs
- **Asynchronous Processing** - Uses Celery for background job processing
- **Rate Limiting** - Implements 2 requests per second rate limit for Typhoon OCR API
- **Webhook Callbacks** - Optional webhook notifications on job completion
- **PostgreSQL Storage** - Stores job information and results
- **Redis Queue** - Message broker for Celery tasks
- **Docker Support** - Containerized deployment with Docker Compose
- **Error Handling** - Comprehensive error handling and retry logic

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Client    │─────▶│  FastAPI    │─────▶│   Celery     │
└─────────────┘      │   Server    │      │   Worker     │
                     └─────────────┘      └──────────────┘
                            │                     │
                            ▼                     ▼
                     ┌─────────────┐      ┌──────────────┐
                     │  PostgreSQL │      │ Typhoon OCR  │
                     └─────────────┘      │     API      │
                            ▲              └──────────────┘
                            │                     │
                     ┌─────────────┐             │
                     │    Redis    │◀────────────┘
                     └─────────────┘
```

## Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)
- Typhoon OCR API key

## Installation

### Local Development

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
   docker run -d -p 6379:6379 redis:7-alpine
   ```

6. **Run the application**
   ```bash
   # Start FastAPI server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Start Celery worker (in another terminal)
   celery -A app.tasks.celery_app worker --loglevel=info
   ```

### Docker Deployment

1. **Set environment variables**
   ```bash
   export TYPHOON_API_KEY=your_api_key_here
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Check logs**
   ```bash
   docker-compose logs -f api
   docker-compose logs -f worker
   ```

## API Endpoints

### Health Check
```http
GET /health
```

### Process PDF
```http
POST /api/v1/process
Content-Type: multipart/form-data

file: <PDF file>
webhook_url: <optional webhook URL>
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "message": "PDF uploaded successfully and queued for processing",
  "file_name": "document.pdf"
}
```

### Get Job Status
```http
GET /api/v1/status/{job_id}
```

**Response (Pending):**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "file_name": "document.pdf",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

**Response (Completed):**
```json
{
  "job_id": "uuid",
  "status": "completed",
  "file_name": "document.pdf",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:01",
  "completed_at": "2024-01-01T00:00:01",
  "result": {
    "text": "Extracted text...",
    "pages": []
  }
}
```

**Response (Failed):**
```json
{
  "job_id": "uuid",
  "status": "failed",
  "file_name": "document.pdf",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:01",
  "completed_at": "2024-01-01T00:00:01",
  "error_message": "Error details...",
  "retry_count": 0
}
```

## Usage Examples

### cURL
```bash
# Process a PDF
curl -X POST http://localhost:8000/api/v1/process \
  -F "file=@document.pdf" \
  -F "webhook_url=https://your-app.com/webhook"

# Check job status
curl http://localhost:8000/api/v1/status/{job_id}
```

### Python
```python
import requests

# Process a PDF
with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/process',
        files={'file': f},
        data={'webhook_url': 'https://your-app.com/webhook'}
    )
    job_id = response.json()['job_id']

# Check status
status_response = requests.get(f'http://localhost:8000/api/v1/status/{job_id}')
print(status_response.json())
```

## Configuration

Key environment variables (see `.env.example` for full list):

| Variable | Description | Default |
|----------|-------------|---------|
| `TYPHOON_API_KEY` | Typhoon OCR API key | *required* |
| `TYPHOON_API_URL` | Typhoon OCR API endpoint | https://api.opentyphoon.ai/v1/ocr |
| `TYPHOON_RATE_LIMIT` | Requests per second | 2 |
| `DATABASE_URL` | PostgreSQL connection string | *required* |
| `REDIS_HOST` | Redis host | localhost |
| `MAX_FILE_SIZE` | Max PDF file size in bytes | 10485760 (10MB) |

## Development

### Running Tests
```bash
pytest
pytest --cov=app tests/
```

### Code Style
```bash
# Format code
black app/

# Lint code
flake8 app/
pylint app/
```

## Monitoring

- **API Logs**: View with `docker-compose logs -f api`
- **Worker Logs**: View with `docker-compose logs -f worker`
- **Health Check**: `GET /health`
- **Celery Flower** (optional): Monitor Celery tasks at http://localhost:5555

## Troubleshooting

### Common Issues

1. **Connection refused to PostgreSQL**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL is correct

2. **Redis connection error**
   - Ensure Redis is running
   - Check CELERY_BROKER_URL is correct

3. **File upload fails**
   - Check MAX_FILE_SIZE setting
   - Ensure UPLOAD_DIR exists and is writable

4. **Rate limiting issues**
   - Adjust TYPHOON_RATE_LIMIT if needed
   - Check Typhoon API quota

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
