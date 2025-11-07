"""Admin routes for job management and monitoring."""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.session import get_db
from app.db.models.job import Job, JobStatus, JobType
from app.db.models.user import User
from app.core.security import get_current_active_user
from app.core.job_manager import job_manager
from datetime import datetime
from typing import Optional
import asyncio
import json
import logging

router = APIRouter(prefix="/admin", tags=["Admin - Job Management"])
logger = logging.getLogger(__name__)


@router.get("/jobs")
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status: pending|queued|running|completed|failed|paused|cancelled"),
    type: Optional[str] = Query(None, description="Filter by type: analysis|rendering|editing"),
    q: Optional[str] = Query(None, description="Search query for job details"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    cursor: Optional[int] = Query(None, description="Pagination cursor (job ID)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List jobs with filtering and pagination.
    
    Returns:
        {
            "items": [Job, ...],
            "next_cursor": 123  // or null if no more results
        }
    """
    
    # Build base query
    query = select(Job).where(Job.user_id == current_user.id)
    
    # Apply status filter
    if status:
        try:
            status_enum = JobStatus(status)
            query = query.where(Job.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    # Apply type filter
    if type:
        try:
            type_enum = JobType(type)
            query = query.where(Job.type == type_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid type: {type}")
    
    # Apply search query
    if q:
        query = query.where(
            or_(
                Job.current_step.ilike(f"%{q}%"),
                Job.error_message.ilike(f"%{q}%")
            )
        )
    
    # Apply cursor pagination
    if cursor:
        query = query.where(Job.id < cursor)
    
    # Order by ID descending and limit
    query = query.order_by(Job.id.desc()).limit(limit + 1)
    
    # Execute query
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    # Check if there are more results
    has_more = len(jobs) > limit
    if has_more:
        jobs = jobs[:limit]
    
    # Get next cursor
    next_cursor = jobs[-1].id if has_more and jobs else None
    
    return {
        "items": [job.to_dict() for job in jobs],
        "next_cursor": next_cursor
    }


@router.get("/jobs/events")
async def job_events_stream(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Server-Sent Events endpoint for real-time job updates.
    
    Streams events:
    - {"type": "queue_snapshot", "jobs": [Job, ...]}
    - {"type": "job_added", "job": {...}}
    - {"type": "job_removed", "job_id": 123}
    - {"type": "progress", "job_id": 123, "status": "running", "step": "...", ...}
    """
    
    async def event_generator():
        # Create queue for this SSE connection
        queue = asyncio.Queue(maxsize=100)
        job_manager.add_sse_connection(queue)
        
        try:
            # Send initial queue snapshot
            result = await db.execute(
                select(Job)
                .where(Job.user_id == current_user.id)
                .order_by(Job.created_at.desc())
                .limit(50)
            )
            jobs = result.scalars().all()
            
            snapshot = {
                "type": "queue_snapshot",
                "jobs": [job.to_dict() for job in jobs]
            }
            yield f"data: {json.dumps(snapshot)}\n\n"
            
            # Stream events as they come
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info("Client disconnected from SSE")
                    break
                
                try:
                    # Wait for event with 30s timeout
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive comment
                    yield f": keepalive\n\n"
                except Exception as e:
                    logger.error(f"Error in SSE stream: {e}")
                    break
        
        finally:
            job_manager.remove_sse_connection(queue)
            logger.info("SSE connection closed")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/jobs/{job_id}/pause")
async def pause_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Pause a running or queued job."""
    
    result = await db.execute(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id
        )
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in [JobStatus.RUNNING, JobStatus.QUEUED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot pause job with status: {job.status.value}"
        )
    
    # Update job status
    job.status = JobStatus.PAUSED
    job.updated_at = datetime.utcnow()
    await db.commit()
    
    # Notify via SSE
    await job_manager.job_progress(
        job_id=job.id,
        status="paused"
    )
    
    return {"message": "Job paused successfully", "job": job.to_dict()}


@router.post("/jobs/{job_id}/resume")
async def resume_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Resume a paused job."""
    
    result = await db.execute(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id
        )
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != JobStatus.PAUSED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resume job with status: {job.status.value}"
        )
    
    # Update job status
    job.status = JobStatus.QUEUED
    job.updated_at = datetime.utcnow()
    await db.commit()
    
    # Notify via SSE
    await job_manager.job_progress(
        job_id=job.id,
        status="queued"
    )
    
    return {"message": "Job resumed successfully", "job": job.to_dict()}


@router.post("/jobs/{job_id}/retry")
async def retry_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retry a failed or cancelled job."""
    
    result = await db.execute(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id
        )
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in [JobStatus.FAILED, JobStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot retry job with status: {job.status.value}"
        )
    
    # Reset job for retry
    job.status = JobStatus.QUEUED
    job.progress_percent = 0.0
    job.current_step = None
    job.step_index = 0
    job.error_message = None
    job.result_data = None
    job.started_at = None
    job.completed_at = None
    job.updated_at = datetime.utcnow()
    await db.commit()
    
    # Notify via SSE
    await job_manager.job_progress(
        job_id=job.id,
        status="queued",
        progress_percent=0.0,
        step_index=0
    )
    
    return {"message": "Job queued for retry", "job": job.to_dict()}


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a pending, queued, running, or paused job."""
    
    result = await db.execute(
        select(Job).where(
            Job.id == job_id,
            Job.user_id == current_user.id
        )
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status in [JobStatus.COMPLETED, JobStatus.CANCELLED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel job with status: {job.status.value}"
        )
    
    # Update job status
    job.status = JobStatus.CANCELLED
    job.completed_at = datetime.utcnow()
    job.updated_at = datetime.utcnow()
    await db.commit()
    
    # Notify via SSE
    await job_manager.job_progress(
        job_id=job.id,
        status="cancelled"
    )
    
    return {"message": "Job cancelled successfully", "job": job.to_dict()}
