from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class Rendering(Base):
    __tablename__ = "renderings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Image details
    image_path = Column(String, nullable=False)
    image_url = Column(String, nullable=True)  # For S3/CDN
    thumbnail_path = Column(String, nullable=True)
    
    # Generation details
    prompt_used = Column(Text, nullable=False)
    image_size = Column(String, nullable=False)  # e.g., "1024x1024"
    model_used = Column(String, default="dall-e-3")
    
    # Version tracking (for edits)
    version = Column(Integer, default=1)
    parent_rendering_id = Column(Integer, ForeignKey("renderings.id"), nullable=True)
    is_latest = Column(Boolean, default=True)
    
    # Metadata
    generation_time_seconds = Column(Integer, nullable=True)
    cost_usd = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="renderings")
    project = relationship("Project", back_populates="renderings")
    edits = relationship("Rendering", remote_side=[parent_rendering_id])
