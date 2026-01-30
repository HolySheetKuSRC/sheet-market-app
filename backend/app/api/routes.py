"""
FastAPI routes for the PDF OCR microservice.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.job import Job, JobStatus
from app.services.pdf_handler import pdf_handler
from app.tasks.ocr_tasks import task_process_pdf_with_typhoon
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/process", response_model=dict)
async def process_pdf(
    file: UploadFile = File(..., description="PDF file to process"),
    webhook_url: Optional[str] = Form(None, description="Optional webhook URL for callbacks"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and process a PDF file with Typhoon OCR.
    
    Args:
        file: PDF file to process
        webhook_url: Optional URL to receive webhook callbacks
        
    Returns:
        Job information with job_id for status tracking
    """
    try:
        # Save the uploaded file
        job_id, file_path = await pdf_handler.save_upload(file)
        
        # Create job record in database
        job = Job(
            id=job_id,
            file_name=file.filename,
            file_path=file_path,
            status=JobStatus.PENDING,
            webhook_url=webhook_url,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        # Queue the processing task
        task_process_pdf_with_typhoon.delay(
            job_id=job_id,
            file_path=file_path,
            webhook_url=webhook_url
        )
        
        logger.info(f"Queued job {job_id} for processing")
        
        return {
            "job_id": job_id,
            "status": "pending",
            "message": "PDF uploaded successfully and queued for processing",
            "file_name": file.filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process upload: {str(e)}"
        )


@router.get("/status/{job_id}", response_model=dict)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the status of a processing job.
    
    Args:
        job_id: The job ID to check
        
    Returns:
        Job status and result (if completed)
    """
    try:
        # Get job from database
        job = await db.get(Job, job_id)
        
        if not job:
            raise HTTPException(
                status_code=404,
                detail=f"Job {job_id} not found"
            )
        
        response = {
            "job_id": job.id,
            "status": job.status.value,
            "file_name": job.file_name,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat()
        }
        
        # Include result if completed
        if job.status == JobStatus.COMPLETED:
            response["result"] = job.result
            response["completed_at"] = job.completed_at.isoformat() if job.completed_at else None
        
        # Include error if failed
        if job.status == JobStatus.FAILED:
            response["error_message"] = job.error_message
            response["retry_count"] = job.retry_count
            response["completed_at"] = job.completed_at.isoformat() if job.completed_at else None
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job status: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "service": "pdf-ocr-service",
        "timestamp": datetime.utcnow().isoformat()
    }
