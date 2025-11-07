from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum


class RoomType(str, enum.Enum):
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    BEDROOM = "bedroom"
    LIVING_ROOM = "living_room"
    DINING_ROOM = "dining_room"
    BASEMENT = "basement"
    OTHER = "other"


class RenovationScope(str, enum.Enum):
    COSMETIC = "cosmetic"
    MODERATE = "moderate"
    FULL = "full"
    LUXURY = "luxury"


class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Project details
    name = Column(String, nullable=False)
    room_type = Column(SQLEnum(RoomType), nullable=False)
    renovation_scope = Column(SQLEnum(RenovationScope), default=RenovationScope.MODERATE)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.DRAFT)
    
    # Room details
    square_footage = Column(Float, nullable=True)
    current_condition = Column(Text, nullable=True)
    desired_style = Column(String, nullable=True)
    
    # AI Analysis results
    visual_assessment = Column(Text, nullable=True)
    design_plan = Column(Text, nullable=True)
    budget_breakdown = Column(JSON, nullable=True)
    timeline_estimate = Column(String, nullable=True)
    
    # Cost estimates
    estimated_cost_low = Column(Float, nullable=True)
    estimated_cost_high = Column(Float, nullable=True)
    
    # Images
    current_room_image = Column(String, nullable=True)  # File path
    inspiration_image = Column(String, nullable=True)  # File path
    
    # Location-specific pricing
    location_multiplier = Column(Float, default=1.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="projects")
    renderings = relationship("Rendering", back_populates="project", cascade="all, delete-orphan")
