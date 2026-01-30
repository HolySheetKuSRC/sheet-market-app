"""
Basic tests for the FastAPI application.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture
def mock_settings():
    """Mock settings to avoid needing a .env file."""
    with patch('app.config.Settings') as mock:
        settings = Mock()
        settings.app_name = "pdf-ocr-service"
        settings.app_version = "1.0.0"
        settings.debug = False
        settings.host = "0.0.0.0"
        settings.port = 8000
        settings.typhoon_api_key = "test_key"
        settings.typhoon_api_url = "https://api.test.com"
        settings.typhoon_rate_limit = 2.0
        settings.redis_host = "localhost"
        settings.redis_port = 6379
        settings.redis_db = 0
        settings.redis_password = None
        settings.database_url = "postgresql+asyncpg://test:test@localhost/test"
        settings.celery_broker_url = "redis://localhost:6379/0"
        settings.celery_result_backend = "redis://localhost:6379/0"
        settings.upload_dir = "/tmp/uploads"
        settings.max_file_size = 10485760
        settings.webhook_timeout = 30
        settings.webhook_retry_count = 3
        mock.return_value = settings
        yield settings


def test_imports():
    """Test that all modules can be imported."""
    try:
        from app import config
        from app import main
        from app.api import routes
        from app.services import typhoon_ocr
        from app.services import pdf_handler
        from app.services import webhook
        from app.tasks import celery_app
        from app.tasks import ocr_tasks
        from app.models import job
        from app.core import database
        assert True
    except ImportError as e:
        pytest.fail(f"Import failed: {e}")


def test_config_module():
    """Test that config module works."""
    from app.config import Settings
    # This will fail without .env but we check it doesn't crash Python
    assert Settings is not None


def test_job_model():
    """Test that Job model is properly defined."""
    from app.models.job import Job, JobStatus
    assert Job is not None
    assert JobStatus is not None
    assert hasattr(JobStatus, 'PENDING')
    assert hasattr(JobStatus, 'PROCESSING')
    assert hasattr(JobStatus, 'COMPLETED')
    assert hasattr(JobStatus, 'FAILED')
