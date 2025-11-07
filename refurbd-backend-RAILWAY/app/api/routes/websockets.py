"""WebSocket endpoints for real-time updates."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.websocket import manager
from app.core.security import verify_token
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.project import Project
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_user_from_websocket(
    websocket: WebSocket,
    token: str = Query(None)
) -> int:
    """
    Authenticate WebSocket connection.
    
    Can use token from:
    1. Query parameter: ?token=xxx
    2. Cookie: access_token
    
    Args:
        websocket: WebSocket connection
        token: Optional token from query parameter
    
    Returns:
        User ID
    
    Raises:
        WebSocketDisconnect: If authentication fails
    """
    if not token:
        # Try to get from cookie
        token = websocket.cookies.get("access_token")
    
    if not token:
        await websocket.close(code=1008, reason="Unauthorized")
        raise WebSocketDisconnect()
    
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
        return int(user_id)
    except Exception as e:
        logger.error(f"WebSocket auth error: {e}")
        await websocket.close(code=1008, reason="Invalid token")
        raise WebSocketDisconnect()


@router.websocket("/ws/projects/{project_id}")
async def websocket_project_updates(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time project updates.
    
    Authentication via:
    - Query param: ws://host/ws/projects/1?token=xxx
    - Cookie: access_token (if SameSite allows)
    
    Sends JSON events:
    - {"type": "status", "status": "analyzing"}
    - {"type": "render_added", "rendering": {...}}
    - {"type": "completed", "project": {...}}
    - {"type": "error", "message": "..."}
    
    Client can send:
    - "ping" -> responds with "pong"
    """
    
    # Authenticate
    try:
        user_id = await get_user_from_websocket(websocket, token)
    except WebSocketDisconnect:
        return
    
    # Verify project ownership
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        await websocket.close(code=1008, reason="Project not found")
        return
    
    # Connect
    await manager.connect(websocket, project_id)
    
    # Send initial status
    await websocket.send_json({
        "type": "connected",
        "project_id": project_id,
        "status": project.status
    })
    
    try:
        while True:
            # Keep connection alive, listen for messages
            data = await websocket.receive_text()
            
            # Handle ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
        logger.info(f"WebSocket disconnected for project {project_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, project_id)
