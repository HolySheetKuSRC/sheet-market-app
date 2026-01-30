"""
Database models for the PDF OCR microservice.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSON
from app.core.database import Base
import enum


class JobStatus(str, enum.Enum):
    """Enum for job status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Job(Base):
    """Model for OCR processing jobs."""
    
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(
        SQLEnum(JobStatus),
        default=JobStatus.PENDING,
        nullable=False,
        index=True
    )
    webhook_url = Column(String(500), nullable=True)
    
    # OCR result
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Retry tracking
    retry_count = Column(Integer, default=0, nullable=False)
    
    def __repr__(self):
        return f"<Job(id={self.id}, status={self.status}, file_name={self.file_name})>"
