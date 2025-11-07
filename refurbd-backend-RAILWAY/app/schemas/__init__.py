from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.db.models.user import SubscriptionTier, UserRole
from app.db.models.project import RoomType, RenovationScope, ProjectStatus


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    role: UserRole  # NEW: Role field for frontend
    subscription_tier: SubscriptionTier
    analyses_used_this_month: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserWithUsage(UserResponse):
    analyses_remaining: int
    can_create_project: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Project Schemas
class ProjectBase(BaseModel):
    name: str
    room_type: RoomType
    renovation_scope: RenovationScope = RenovationScope.MODERATE
    square_footage: Optional[float] = None
    desired_style: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    status: ProjectStatus
    visual_assessment: Optional[str] = None
    design_plan: Optional[str] = None
    timeline_estimate: Optional[str] = None
    estimated_cost_low: Optional[float] = None
    estimated_cost_high: Optional[float] = None
    current_room_image: Optional[str] = None
    inspiration_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProjectWithRenderings(ProjectResponse):
    renderings: List["RenderingResponse"] = []


# Rendering Schemas
class RenderingBase(BaseModel):
    prompt_used: str
    image_size: str


class RenderingCreate(RenderingBase):
    project_id: int


class RenderingResponse(BaseModel):
    id: int
    project_id: int
    image_path: str
    image_url: Optional[str] = None
    thumbnail_path: Optional[str] = None
    image_size: str
    version: int
    is_latest: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Analysis Request
class AnalysisRequest(BaseModel):
    project_id: int
    current_room_description: Optional[str] = None
    budget_constraint: Optional[float] = None


# Rendering Edit Request
class RenderingEditRequest(BaseModel):
    rendering_id: int
    edit_instructions: str


# Subscription Schemas
class SubscriptionCheckout(BaseModel):
    tier: SubscriptionTier
    success_url: str
    cancel_url: str


class SubscriptionResponse(BaseModel):
    session_id: str
    url: str


# Update forward refs
ProjectWithRenderings.model_rebuild()
