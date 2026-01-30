"""
Celery tasks for OCR processing.
"""
from celery import Task
from datetime import datetime
from app.tasks.celery_app import celery_app
from app.services.typhoon_ocr import typhoon_ocr
from app.services.webhook import webhook_service
from app.services.pdf_handler import pdf_handler
from app.core.database import async_session_maker
from app.models.job import Job, JobStatus
import logging
import asyncio

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Base task with callbacks."""
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure."""
        logger.error(f"Task {task_id} failed: {exc}")


@celery_app.task(bind=True, base=CallbackTask, name='tasks.process_pdf_with_typhoon')
def task_process_pdf_with_typhoon(
    self,
    job_id: str,
    file_path: str,
    webhook_url: str = None
):
    """
    Process PDF file with Typhoon OCR API.
    
    Args:
        job_id: Unique job identifier
        file_path: Path to the PDF file
        webhook_url: Optional webhook URL for callbacks
    """
    logger.info(f"Starting OCR processing for job {job_id}")
    
    # Run async processing
    result = asyncio.run(
        _process_pdf_async(job_id, file_path, webhook_url)
    )
    
    return result


async def _process_pdf_async(
    job_id: str,
    file_path: str,
    webhook_url: str = None
):
    """
    Async implementation of PDF processing.
    
    Args:
        job_id: Unique job identifier
        file_path: Path to the PDF file
        webhook_url: Optional webhook URL for callbacks
    """
    async with async_session_maker() as session:
        try:
            # Update job status to processing
            job = await session.get(Job, job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return {"error": "Job not found"}
            
            job.status = JobStatus.PROCESSING
            await session.commit()
            
            # Process PDF with Typhoon OCR
            logger.info(f"Processing PDF with Typhoon OCR: {file_path}")
            ocr_result = await typhoon_ocr.process_pdf(file_path)
            
            # Update job with result
            job.status = JobStatus.COMPLETED
            job.result = ocr_result
            job.completed_at = datetime.utcnow()
            await session.commit()
            
            logger.info(f"Successfully completed OCR for job {job_id}")
            
            # Send webhook if provided
            if webhook_url:
                await webhook_service.send_job_completion(
                    webhook_url=webhook_url,
                    job_id=job_id,
                    status="completed",
                    result=ocr_result
                )
            
            # Clean up file after successful processing
            pdf_handler.delete_file(file_path)
            
            return {
                "job_id": job_id,
                "status": "completed",
                "result": ocr_result
            }
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")
            
            # Update job with error
            job = await session.get(Job, job_id)
            if job:
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.retry_count += 1
                job.completed_at = datetime.utcnow()
                await session.commit()
            
            # Send webhook if provided
            if webhook_url:
                await webhook_service.send_job_completion(
                    webhook_url=webhook_url,
                    job_id=job_id,
                    status="failed",
                    error_message=str(e)
                )
            
            # Clean up file after failed processing
            pdf_handler.delete_file(file_path)
            
            raise
