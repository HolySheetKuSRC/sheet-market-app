"""
Webhook callback service.
"""
import aiohttp
import asyncio
from typing import Dict, Any, Optional
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class WebhookService:
    """Service for sending webhook callbacks."""
    
    def __init__(self):
        self.timeout = settings.webhook_timeout
        self.retry_count = settings.webhook_retry_count
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session."""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def close(self):
        """Close the aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def send_webhook(
        self,
        webhook_url: str,
        payload: Dict[str, Any],
        retry: int = 0
    ) -> bool:
        """
        Send webhook callback with retry logic.
        
        Args:
            webhook_url: The URL to send the webhook to
            payload: The data to send
            retry: Current retry attempt (internal use)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not webhook_url:
            logger.warning("No webhook URL provided")
            return False
        
        session = await self._get_session()
        
        try:
            logger.info(f"Sending webhook to {webhook_url} (attempt {retry + 1}/{self.retry_count + 1})")
            
            async with session.post(
                webhook_url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            ) as response:
                response.raise_for_status()
                logger.info(f"Successfully sent webhook to {webhook_url}")
                return True
                
        except aiohttp.ClientResponseError as e:
            logger.error(f"Webhook error: {e.status} - {e.message}")
            
            # Retry on 5xx errors
            if e.status >= 500 and retry < self.retry_count:
                await asyncio.sleep(2 ** retry)  # Exponential backoff
                return await self.send_webhook(webhook_url, payload, retry + 1)
            return False
            
        except aiohttp.ClientError as e:
            logger.error(f"Network error sending webhook: {str(e)}")
            
            # Retry on network errors
            if retry < self.retry_count:
                await asyncio.sleep(2 ** retry)  # Exponential backoff
                return await self.send_webhook(webhook_url, payload, retry + 1)
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error sending webhook: {str(e)}")
            return False
    
    async def send_job_completion(
        self,
        webhook_url: str,
        job_id: str,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Send job completion webhook.
        
        Args:
            webhook_url: The URL to send the webhook to
            job_id: The job ID
            status: Job status (completed/failed)
            result: OCR result data (if successful)
            error_message: Error message (if failed)
            
        Returns:
            bool: True if successful, False otherwise
        """
        payload = {
            "job_id": job_id,
            "status": status,
            "result": result,
            "error_message": error_message
        }
        
        return await self.send_webhook(webhook_url, payload)


# Global instance
webhook_service = WebhookService()
