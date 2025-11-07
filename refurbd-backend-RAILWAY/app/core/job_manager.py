"""Job manager for real-time job tracking and notifications."""
from typing import Dict, List, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)


class JobManager:
    """Manage jobs and SSE connections for real-time updates."""
    
    def __init__(self):
        self.sse_connections: List[asyncio.Queue] = []
        self.job_cache: Dict[int, dict] = {}
    
    def add_sse_connection(self, queue: asyncio.Queue):
        """Add an SSE connection queue."""
        self.sse_connections.append(queue)
        logger.info(f"SSE connection added. Total connections: {len(self.sse_connections)}")
    
    def remove_sse_connection(self, queue: asyncio.Queue):
        """Remove an SSE connection queue."""
        try:
            self.sse_connections.remove(queue)
            logger.info(f"SSE connection removed. Total connections: {len(self.sse_connections)}")
        except ValueError:
            pass  # Queue already removed
    
    async def broadcast_event(self, event: dict):
        """
        Broadcast an event to all connected SSE clients.
        
        Args:
            event: Event dictionary to broadcast
        """
        if not self.sse_connections:
            return
        
        dead_queues = []
        
        for queue in self.sse_connections:
            try:
                await asyncio.wait_for(queue.put(event), timeout=1.0)
            except asyncio.TimeoutError:
                logger.warning("Queue full, dropping event")
                dead_queues.append(queue)
            except Exception as e:
                logger.error(f"Failed to send to queue: {e}")
                dead_queues.append(queue)
        
        # Remove dead connections
        for queue in dead_queues:
            self.remove_sse_connection(queue)
    
    async def send_snapshot(self, jobs: List[dict]):
        """
        Send a queue snapshot event.
        
        Args:
            jobs: List of job dictionaries
        """
        await self.broadcast_event({
            "type": "queue_snapshot",
            "jobs": jobs
        })
    
    async def job_added(self, job: dict):
        """
        Notify that a job was added to the queue.
        
        Args:
            job: Job dictionary
        """
        self.job_cache[job["id"]] = job
        await self.broadcast_event({
            "type": "job_added",
            "job": job
        })
        logger.info(f"Job added: {job['id']} ({job['type']})")
    
    async def job_removed(self, job_id: int):
        """
        Notify that a job was removed from the queue.
        
        Args:
            job_id: ID of the removed job
        """
        self.job_cache.pop(job_id, None)
        await self.broadcast_event({
            "type": "job_removed",
            "job_id": job_id
        })
        logger.info(f"Job removed: {job_id}")
    
    async def job_progress(
        self,
        job_id: int,
        status: str,
        step: Optional[str] = None,
        step_index: Optional[int] = None,
        step_total: Optional[int] = None,
        progress_percent: Optional[float] = None,
        eta_seconds: Optional[int] = None
    ):
        """
        Send a job progress update.
        
        Args:
            job_id: ID of the job
            status: Current job status
            step: Current step description
            step_index: Current step number
            step_total: Total number of steps
            progress_percent: Progress percentage (0-100)
            eta_seconds: Estimated time remaining in seconds
        """
        event = {
            "type": "progress",
            "job_id": job_id,
            "status": status,
        }
        
        if step is not None:
            event["step"] = step
        if step_index is not None:
            event["step_index"] = step_index
        if step_total is not None:
            event["step_total"] = step_total
        if progress_percent is not None:
            event["progress_percent"] = progress_percent
        if eta_seconds is not None:
            event["eta_seconds"] = eta_seconds
        
        await self.broadcast_event(event)
        logger.debug(f"Job progress: {job_id} - {progress_percent}% - {step}")


# Global job manager instance
job_manager = JobManager()
