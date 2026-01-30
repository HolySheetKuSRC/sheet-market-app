"""
PDF file handling service.
"""
import os
import uuid
import re
from pathlib import Path
from typing import BinaryIO
from fastapi import UploadFile, HTTPException
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class PDFHandler:
    """Handler for PDF file operations."""
    
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.max_file_size = settings.max_file_size
        
        # Create upload directory if it doesn't exist
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent directory traversal and other attacks.
        
        Args:
            filename: The original filename
            
        Returns:
            Sanitized filename
        """
        # Remove any path components
        filename = os.path.basename(filename)
        
        # Remove any non-alphanumeric characters except dots, dashes, and underscores
        filename = re.sub(r'[^\w\-\.]', '_', filename)
        
        # Ensure it ends with .pdf
        if not filename.lower().endswith('.pdf'):
            filename = filename + '.pdf'
        
        return filename
    
    def validate_pdf(self, file: UploadFile) -> None:
        """
        Validate PDF file.
        
        Args:
            file: The uploaded file
            
        Raises:
            HTTPException: If validation fails
        """
        # Check content type
        if file.content_type not in ['application/pdf', 'application/x-pdf']:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only PDF files are accepted."
            )
        
        # Check file extension
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file extension. File must have .pdf extension."
            )
    
    async def save_upload(self, file: UploadFile) -> tuple[str, str]:
        """
        Save uploaded PDF file to disk.
        
        Args:
            file: The uploaded file
            
        Returns:
            Tuple of (job_id, file_path)
            
        Raises:
            HTTPException: If file operations fail
        """
        # Validate the file
        self.validate_pdf(file)
        
        # Generate unique job ID and sanitize filename
        job_id = str(uuid.uuid4())
        safe_filename = self.sanitize_filename(file.filename)
        final_filename = f"{job_id}_{safe_filename}"
        file_path = self.upload_dir / final_filename
        
        try:
            # Read and save file in chunks to handle large files
            with open(file_path, 'wb') as f:
                while chunk := await file.read(8192):  # 8KB chunks
                    # Check file size
                    if f.tell() > self.max_file_size:
                        f.close()
                        file_path.unlink()  # Delete the file
                        raise HTTPException(
                            status_code=413,
                            detail=f"File too large. Maximum size is {self.max_file_size / (1024*1024):.2f}MB"
                        )
                    f.write(chunk)
            
            logger.info(f"Saved file: {file_path} (job_id: {job_id})")
            return job_id, str(file_path)
            
        except HTTPException:
            raise
        except Exception as e:
            # Clean up file if it exists
            if file_path.exists():
                file_path.unlink()
            logger.error(f"Error saving file: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save file: {str(e)}"
            )
    
    def delete_file(self, file_path: str) -> None:
        """
        Delete a file from disk.
        
        Args:
            file_path: Path to the file to delete
        """
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
                logger.info(f"Deleted file: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {str(e)}")
    
    def get_file_info(self, file_path: str) -> dict:
        """
        Get information about a file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with file information
        """
        try:
            path = Path(file_path)
            if not path.exists():
                return {"exists": False}
            
            stat = path.stat()
            return {
                "exists": True,
                "size": stat.st_size,
                "size_mb": stat.st_size / (1024 * 1024),
                "filename": path.name
            }
        except Exception as e:
            logger.error(f"Error getting file info for {file_path}: {str(e)}")
            return {"exists": False, "error": str(e)}


# Global instance
pdf_handler = PDFHandler()
