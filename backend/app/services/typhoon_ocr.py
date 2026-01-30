"""
Typhoon OCR API wrapper with rate limiting.
"""
import asyncio
import aiohttp
import aiofiles
from typing import Optional, Dict, Any
from aiolimiter import AsyncLimiter
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class TyphoonOCRService:
    """
    Wrapper for Typhoon OCR API with rate limiting.
    Implements 2 requests per second rate limit.
    """
    
    def __init__(self):
        self.api_key = settings.typhoon_api_key
        self.api_url = settings.typhoon_api_url
        # Create rate limiter: 2 requests per second
        self.rate_limiter = AsyncLimiter(
            max_rate=settings.typhoon_rate_limit,
            time_period=1.0
        )
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={
                    "Authorization": f"Bearer {self.api_key}"
                }
            )
        return self.session
    
    async def close(self):
        """Close the aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def process_pdf(
        self,
        pdf_path: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a PDF file using Typhoon OCR API.
        
        Args:
            pdf_path: Path to the PDF file
            options: Optional processing options
            
        Returns:
            Dict containing OCR results
            
        Raises:
            Exception: If the API request fails
        """
        async with self.rate_limiter:
            logger.info(f"Processing PDF: {pdf_path}")
            
            session = await self._get_session()
            
            try:
                # Read PDF file asynchronously
                async with aiofiles.open(pdf_path, 'rb') as f:
                    pdf_data = await f.read()
                
                # Prepare form data for multipart/form-data request
                data = aiohttp.FormData()
                data.add_field(
                    'file',
                    pdf_data,
                    filename=pdf_path.split('/')[-1],
                    content_type='application/pdf'
                )
                
                # Add options if provided
                if options:
                    for key, value in options.items():
                        data.add_field(key, str(value))
                
                # Make API request with rate limiting
                async with session.post(
                    self.api_url,
                    data=data,
                    timeout=aiohttp.ClientTimeout(total=300)  # 5 minutes timeout
                ) as response:
                    response.raise_for_status()
                    result = await response.json()
                    
                    logger.info(f"Successfully processed PDF: {pdf_path}")
                    return result
                    
            except aiohttp.ClientResponseError as e:
                logger.error(f"API error processing {pdf_path}: {e.status} - {e.message}")
                raise Exception(f"Typhoon OCR API error: {e.status} - {e.message}")
            except aiohttp.ClientError as e:
                logger.error(f"Network error processing {pdf_path}: {str(e)}")
                raise Exception(f"Network error: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error processing {pdf_path}: {str(e)}")
                raise Exception(f"Unexpected error: {str(e)}")
    
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of an OCR job.
        
        Args:
            job_id: The job ID to check
            
        Returns:
            Dict containing job status
        """
        async with self.rate_limiter:
            session = await self._get_session()
            
            try:
                async with session.get(
                    f"{self.api_url}/jobs/{job_id}",
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    response.raise_for_status()
                    return await response.json()
            except Exception as e:
                logger.error(f"Error getting job status: {str(e)}")
                raise Exception(f"Failed to get job status: {str(e)}")


# Global instance
typhoon_ocr = TyphoonOCRService()
