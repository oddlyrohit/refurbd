"""Job model for background task tracking."""
from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.base import Base
import enum
from datetime import datetime


class JobStatus(str, enum.Enum):
    """Job status types."""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class JobType(str, enum.Enum):
    """Job types."""
    ANALYSIS = "analysis"
    RENDERING = "rendering"
    EDITING = "editing"


class Job(Base):
    """Job model for tracking background tasks."""
    
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    project_id = Column(Integer, index=True, nullable=True)
    rendering_id = Column(Integer, index=True, nullable=True)
    
    # Job details
    type = Column(SQLEnum(JobType), nullable=False, index=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING, index=True)
    
    # Progress tracking
    progress_percent = Column(Float, default=0.0)
    current_step = Column(String(255), nullable=True)
    step_index = Column(Integer, default=0)
    step_total = Column(Integer, default=0)
    eta_seconds = Column(Integer, nullable=True)
    
    # Results
    result_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def to_dict(self):
        """Convert job to dictionary for API responses."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "rendering_id": self.rendering_id,
            "type": self.type.value,
            "status": self.status.value,
            "progress_percent": self.progress_percent,
            "current_step": self.current_step,
            "step_index": self.step_index,
            "step_total": self.step_total,
            "eta_seconds": self.eta_seconds,
            "result_data": self.result_data,
            "error_message": self.error_message,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
