"""
Tests for the services.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


def test_typhoon_ocr_service_init():
    """Test TyphoonOCRService initialization."""
    with patch('app.services.typhoon_ocr.settings') as mock_settings:
        mock_settings.typhoon_api_key = "test_key"
        mock_settings.typhoon_api_url = "https://api.test.com"
        mock_settings.typhoon_rate_limit = 2.0
        
        from app.services.typhoon_ocr import TyphoonOCRService
        service = TyphoonOCRService()
        
        assert service.api_key == "test_key"
        assert service.api_url == "https://api.test.com"
        assert service.rate_limiter is not None


def test_pdf_handler_init():
    """Test PDFHandler initialization."""
    with patch('app.services.pdf_handler.settings') as mock_settings:
        mock_settings.upload_dir = "/tmp/test_uploads"
        mock_settings.max_file_size = 10485760
        
        from app.services.pdf_handler import PDFHandler
        handler = PDFHandler()
        
        assert handler.max_file_size == 10485760
        assert handler.upload_dir.name == "test_uploads"


def test_webhook_service_init():
    """Test WebhookService initialization."""
    with patch('app.services.webhook.settings') as mock_settings:
        mock_settings.webhook_timeout = 30
        mock_settings.webhook_retry_count = 3
        
        from app.services.webhook import WebhookService
        service = WebhookService()
        
        assert service.timeout == 30
        assert service.retry_count == 3
