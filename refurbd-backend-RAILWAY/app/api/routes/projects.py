from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pathlib import Path
import shutil
from datetime import datetime

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.project import Project, ProjectStatus, RoomType, RenovationScope
from app.db.models.rendering import Rendering
from app.schemas import (
    ProjectCreate, ProjectResponse, ProjectWithRenderings,
    AnalysisRequest
)
from app.core.security import get_current_active_user
from app.services.room_analyzer import room_analyzer
from app.services.image_generator import image_generator
from app.services.cost_estimator import cost_estimator
from app.services.email_service import email_service
from app.core.config import settings

router = APIRouter(prefix="/projects", tags=["Projects"])


def check_usage_limit(user: User) -> bool:
    """Check if user has remaining analyses for the month."""
    from app.db.models.user import SubscriptionTier
    
    # Unlimited tiers
    if user.subscription_tier in [SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]:
        return True
    
    limits = {
        SubscriptionTier.FREE: settings.FREE_TIER_ANALYSES_PER_MONTH,
        SubscriptionTier.BASIC: settings.BASIC_TIER_ANALYSES_PER_MONTH,
    }
    
    limit = limits.get(user.subscription_tier, 0)
    
    # Check if we need to reset monthly counter
    from datetime import datetime, timedelta
    if user.last_analysis_reset:
        days_since_reset = (datetime.utcnow() - user.last_analysis_reset).days
        if days_since_reset >= 30:
            return True  # Will reset in the endpoint
    
    return user.analyses_used_this_month < limit


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    name: str = Form(...),
    room_type: RoomType = Form(...),
    renovation_scope: RenovationScope = Form(RenovationScope.MODERATE),
    square_footage: Optional[float] = Form(None),
    desired_style: Optional[str] = Form(None),
    current_room_image: Optional[UploadFile] = File(None),
    inspiration_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new renovation project with optional image uploads."""
    
    # Check usage limits
    if not check_usage_limit(current_user):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly analysis limit reached. Please upgrade your plan."
        )
    
    # Create project
    project = Project(
        user_id=current_user.id,
        name=name,
        room_type=room_type,
        renovation_scope=renovation_scope,
        square_footage=square_footage,
        desired_style=desired_style,
        status=ProjectStatus.DRAFT
    )
    
    # Handle file uploads
    upload_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    if current_room_image:
        file_path = upload_dir / f"current_{project.id}_{current_room_image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(current_room_image.file, buffer)
        project.current_room_image = str(file_path)
    
    if inspiration_image:
        file_path = upload_dir / f"inspiration_{project.id}_{inspiration_image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(inspiration_image.file, buffer)
        project.inspiration_image = str(file_path)
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse.model_validate(project)


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all projects for the current user."""
    
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    projects = result.scalars().all()
    
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectWithRenderings)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific project with all renderings."""
    
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectWithRenderings.model_validate(project)


async def run_analysis_task(
    project_id: int,
    user_id: int,
    budget_constraint: Optional[float],
    db_url: str
):
    """Background task to run the full analysis pipeline."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from app.db.models.user import User
    from app.db.models.project import Project
    from sqlalchemy import select
    
    # Create new DB session for background task
    engine = create_async_engine(db_url, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        try:
            # Get project and user
            result = await db.execute(
                select(Project).where(Project.id == project_id)
            )
            project = result.scalar_one()
            
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one()
            
            # Update status
            project.status = ProjectStatus.ANALYZING
            await db.commit()
            
            # Step 1: Room Analysis with Claude
            location = {
                "city": user.city or "",
                "state": user.state or "",
                "country": user.country or "US"
            }
            
            analysis = await room_analyzer.analyze_room(
                current_room_image=project.current_room_image,
                inspiration_image=project.inspiration_image,
                room_type=project.room_type.value,
                desired_style=project.desired_style,
                square_footage=project.square_footage,
                budget_constraint=budget_constraint,
                location=location
            )
            
            # Save analysis
            project.visual_assessment = analysis.get("visual_assessment", "")
            project.design_plan = analysis.get("design_plan", "")
            
            # Step 2: Cost Estimation
            cost_estimate = cost_estimator.estimate_cost(
                room_type=project.room_type,
                scope=project.renovation_scope,
                square_footage=project.square_footage or 150,
                state=user.state,
                city=user.city
            )
            
            project.estimated_cost_low = cost_estimate["cost_low"]
            project.estimated_cost_high = cost_estimate["cost_high"]
            project.location_multiplier = cost_estimate["location_multiplier"]
            project.budget_breakdown = cost_estimate["breakdown"]
            
            # Step 3: Timeline
            timeline = cost_estimator.get_timeline_estimate(
                scope=project.renovation_scope,
                room_type=project.room_type
            )
            project.timeline_estimate = timeline
            
            # Step 4: Generate Rendering
            image_sizes = {
                "free": settings.FREE_IMAGE_SIZE,
                "basic": settings.BASIC_IMAGE_SIZE,
                "pro": settings.PRO_IMAGE_SIZE,
                "enterprise": settings.ENTERPRISE_IMAGE_SIZE,
            }
            image_size = image_sizes.get(user.subscription_tier.value, "1024x1024")
            
            # Build detailed prompt from design plan
            design_desc = analysis.get("design_plan", "")
            if not design_desc:
                design_desc = f"Modern {project.room_type.value} with {project.desired_style or 'contemporary'} style"
            
            # Save path
            render_dir = Path(settings.UPLOAD_DIR) / str(user.id) / "renderings"
            render_dir.mkdir(parents=True, exist_ok=True)
            render_path = render_dir / f"project_{project_id}_v1.png"
            
            image_path, gen_time = await image_generator.generate_rendering(
                design_description=design_desc,
                room_type=project.room_type.value,
                style=project.desired_style or "modern",
                image_size=image_size,
                save_path=str(render_path)
            )
            
            # Save rendering
            rendering = Rendering(
                user_id=user.id,
                project_id=project.id,
                image_path=str(image_path),
                prompt_used=design_desc[:500],
                image_size=image_size,
                version=1,
                is_latest=True,
                generation_time_seconds=int(gen_time)
            )
            db.add(rendering)
            
            # Update project status
            project.status = ProjectStatus.COMPLETED
            project.completed_at = datetime.utcnow()
            
            # Update user usage
            user.analyses_used_this_month += 1
            
            await db.commit()
            
            # Send email notification
            try:
                await email_service.send_analysis_complete_email(
                    user.email,
                    user.full_name or "there",
                    project.name,
                    project.id
                )
            except Exception as e:
                print(f"Failed to send completion email: {e}")
            
        except Exception as e:
            print(f"Error in analysis task: {e}")
            project.status = ProjectStatus.DRAFT
            await db.commit()
        finally:
            await engine.dispose()


@router.post("/{project_id}/analyze", status_code=status.HTTP_202_ACCEPTED)
async def analyze_project(
    project_id: int,
    analysis_req: AnalysisRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Start AI analysis of the project (runs in background)."""
    
    # Get project
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check usage limits
    if not check_usage_limit(current_user):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Monthly analysis limit reached. Please upgrade your plan."
        )
    
    # Add background task
    database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    background_tasks.add_task(
        run_analysis_task,
        project_id,
        current_user.id,
        analysis_req.budget_constraint,
        database_url
    )
    
    return {
        "message": "Analysis started",
        "project_id": project_id,
        "status": "processing"
    }


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a project."""
    
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    
    return None
