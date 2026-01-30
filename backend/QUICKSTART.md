# Quick Start Guide - PDF OCR Microservice

This guide will help you get the PDF OCR microservice up and running quickly.

## Prerequisites

- Python 3.11 or higher
- Docker and Docker Compose (recommended)
- OR PostgreSQL 15+ and Redis 7+ (for manual setup)

## Quick Start with Docker (Recommended)

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Set your Typhoon API key**
   ```bash
   export TYPHOON_API_KEY=your_actual_api_key_here
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Check that services are running**
   ```bash
   docker-compose ps
   ```

5. **View logs**
   ```bash
   docker-compose logs -f api
   ```

6. **Test the API**
   ```bash
   # Health check
   curl http://localhost:8000/health
   
   # Process a PDF
   curl -X POST http://localhost:8000/api/v1/process \
     -F "file=@/path/to/your/document.pdf" \
     -F "webhook_url=https://your-app.com/webhook"
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /` - Service info
- `POST /api/v1/process` - Upload and process PDF
- `GET /api/v1/status/{job_id}` - Get job status

## Example Usage

### Python
```python
import requests

# Process a PDF
with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/process',
        files={'file': f},
        data={'webhook_url': 'https://your-app.com/webhook'}  # Optional
    )
    job_id = response.json()['job_id']
    print(f"Job ID: {job_id}")

# Check status
import time
while True:
    status_response = requests.get(f'http://localhost:8000/api/v1/status/{job_id}')
    data = status_response.json()
    print(f"Status: {data['status']}")
    
    if data['status'] in ['completed', 'failed']:
        if data['status'] == 'completed':
            print(f"Result: {data['result']}")
        else:
            print(f"Error: {data['error_message']}")
        break
    
    time.sleep(2)  # Poll every 2 seconds
```

### cURL
```bash
# Upload PDF
JOB_ID=$(curl -X POST http://localhost:8000/api/v1/process \
  -F "file=@document.pdf" \
  | jq -r '.job_id')

echo "Job ID: $JOB_ID"

# Check status
curl http://localhost:8000/api/v1/status/$JOB_ID | jq
```

## Stopping the Services

```bash
docker-compose down
```

## Troubleshooting

### Services won't start
- Make sure ports 8000, 5432, and 6379 are not in use
- Check Docker logs: `docker-compose logs`

### Upload fails
- Check file size (default max: 10MB)
- Ensure file is a valid PDF
- Check API logs: `docker-compose logs api`

### Processing fails
- Verify Typhoon API key is set correctly
- Check worker logs: `docker-compose logs worker`
- Verify network connectivity to Typhoon API

## Development Mode

For development with hot-reload:

```bash
# Start dependencies only
docker-compose up -d db redis

# Run API locally
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run worker locally (in another terminal)
celery -A app.tasks.celery_app worker --loglevel=info
```

## More Information

See [README.md](README.md) for complete documentation.
