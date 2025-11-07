from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
from typing import List

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.project import Project
from app.db.models.rendering import Rendering
from app.schemas import RenderingResponse, RenderingEditRequest
from app.core.security import get_current_active_user
from app.services.image_generator import image_generator
from app.core.config import settings

router = APIRouter(prefix="/renderings", tags=["Renderings"])


@router.get("/{rendering_id}", response_model=RenderingResponse)
async def get_rendering(
    rendering_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get rendering details."""
    
    result = await db.execute(
        select(Rendering).where(
            Rendering.id == rendering_id,
            Rendering.user_id == current_user.id
        )
    )
    rendering = result.scalar_one_or_none()
    
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found")
    
    return RenderingResponse.model_validate(rendering)


@router.get("/{rendering_id}/download")
async def download_rendering(
    rendering_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download rendering image file."""
    
    result = await db.execute(
        select(Rendering).where(
            Rendering.id == rendering_id,
            Rendering.user_id == current_user.id
        )
    )
    rendering = result.scalar_one_or_none()
    
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found")
    
    file_path = Path(rendering.image_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="image/png",
        filename=f"renovation_rendering_{rendering_id}.png"
    )


async def edit_rendering_task(
    rendering_id: int,
    user_id: int,
    edit_instructions: str,
    db_url: str
):
    """Background task to edit rendering."""
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from app.db.models.user import User
    from app.db.models.rendering import Rendering
    from sqlalchemy import select
    
    engine = create_async_engine(db_url, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        try:
            # Get original rendering and user
            result = await db.execute(
                select(Rendering).where(Rendering.id == rendering_id)
            )
            original = result.scalar_one()
            
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one()
            
            # Determine image size based on subscription
            image_sizes = {
                "free": settings.FREE_IMAGE_SIZE,
                "basic": settings.BASIC_IMAGE_SIZE,
                "pro": settings.PRO_IMAGE_SIZE,
                "enterprise": settings.ENTERPRISE_IMAGE_SIZE,
            }
            image_size = image_sizes.get(user.subscription_tier.value, "1024x1024")
            
            # Generate edited version
            render_dir = Path(settings.UPLOAD_DIR) / str(user.id) / "renderings"
            render_dir.mkdir(parents=True, exist_ok=True)
            
            new_version = original.version + 1
            render_path = render_dir / f"project_{original.project_id}_v{new_version}.png"
            
            image_path, gen_time = await image_generator.edit_rendering(
                original_image_path=original.image_path,
                edit_instructions=edit_instructions,
                image_size=image_size,
                save_path=str(render_path)
            )
            
            # Mark old renderings as not latest
            await db.execute(
                select(Rendering).where(
                    Rendering.project_id == original.project_id,
                    Rendering.is_latest == True
                )
            )
            old_renderings = result.scalars().all()
            for r in old_renderings:
                r.is_latest = False
            
            # Create new rendering
            new_rendering = Rendering(
                user_id=user.id,
                project_id=original.project_id,
                image_path=str(image_path),
                prompt_used=edit_instructions[:500],
                image_size=image_size,
                version=new_version,
                parent_rendering_id=rendering_id,
                is_latest=True,
                generation_time_seconds=int(gen_time)
            )
            db.add(new_rendering)
            await db.commit()
            
        except Exception as e:
            print(f"Error in edit rendering task: {e}")
        finally:
            await engine.dispose()


@router.post("/{rendering_id}/edit", status_code=status.HTTP_202_ACCEPTED)
async def edit_rendering(
    rendering_id: int,
    edit_req: RenderingEditRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Edit an existing rendering based on instructions."""
    
    # Verify rendering belongs to user
    result = await db.execute(
        select(Rendering).where(
            Rendering.id == rendering_id,
            Rendering.user_id == current_user.id
        )
    )
    rendering = result.scalar_one_or_none()
    
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found")
    
    # Add background task
    database_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    background_tasks.add_task(
        edit_rendering_task,
        rendering_id,
        current_user.id,
        edit_req.edit_instructions,
        database_url
    )
    
    return {
        "message": "Edit started",
        "rendering_id": rendering_id,
        "status": "processing"
    }


@router.get("/project/{project_id}", response_model=List[RenderingResponse])
async def list_project_renderings(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all renderings for a project."""
    
    # Verify project ownership
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = await db.execute(
        select(Rendering)
        .where(Rendering.project_id == project_id)
        .order_by(Rendering.version.desc())
    )
    renderings = result.scalars().all()
    
    return [RenderingResponse.model_validate(r) for r in renderings]
