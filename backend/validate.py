#!/usr/bin/env python3
"""
Quick validation script to test that the FastAPI app can be imported and initialized.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set required environment variables for testing
os.environ['TYPHOON_API_KEY'] = 'test_api_key'
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://test:test@localhost/test'

print("Testing FastAPI application imports...")

try:
    # Test config
    from app.config import settings
    print(f"✓ Config loaded - App: {settings.app_name} v{settings.app_version}")
    
    # Test services
    from app.services.typhoon_ocr import typhoon_ocr
    print("✓ Typhoon OCR service initialized")
    
    from app.services.pdf_handler import pdf_handler
    print("✓ PDF handler initialized")
    
    from app.services.webhook import webhook_service
    print("✓ Webhook service initialized")
    
    # Test models
    from app.models.job import Job, JobStatus
    print(f"✓ Job model loaded with statuses: {', '.join([s.value for s in JobStatus])}")
    
    # Test Celery app
    from app.tasks.celery_app import celery_app
    print(f"✓ Celery app initialized: {celery_app.main}")
    
    # Test API routes
    from app.api.routes import router
    print(f"✓ API routes loaded: {len(router.routes)} routes")
    
    # Test main app - NOTE: This will fail without database, but we can check import
    print("\nAttempting to import main app (may fail due to missing database)...")
    from app.main import app
    print(f"✓ FastAPI app created: {app.title} v{app.version}")
    
    print("\n✅ All imports successful! The application structure is valid.")
    print("\nNext steps to run the application:")
    print("1. Set up PostgreSQL and Redis")
    print("2. Copy .env.example to .env and configure")
    print("3. Run: uvicorn app.main:app --reload")
    print("4. Run Celery worker: celery -A app.tasks.celery_app worker")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
