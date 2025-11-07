"""WebSocket connection manager for real-time updates."""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections for real-time project updates."""
    
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, project_id: int):
        """Accept and store WebSocket connection."""
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        logger.info(f"WebSocket connected for project {project_id}")
    
    def disconnect(self, websocket: WebSocket, project_id: int):
        """Remove WebSocket connection."""
        if project_id in self.active_connections:
            try:
                self.active_connections[project_id].remove(websocket)
                if not self.active_connections[project_id]:
                    del self.active_connections[project_id]
                logger.info(f"WebSocket disconnected for project {project_id}")
            except ValueError:
                pass  # Connection already removed
    
    async def send_project_update(self, project_id: int, message: dict):
        """
        Send update to all connections for a project.
        
        Args:
            project_id: ID of the project
            message: JSON-serializable message to send
        """
        if project_id not in self.active_connections:
            return
        
        dead_connections = []
        for connection in self.active_connections[project_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending WebSocket message: {e}")
                dead_connections.append(connection)
        
        # Remove dead connections
        for connection in dead_connections:
            self.disconnect(connection, project_id)
    
    async def broadcast_to_user(self, user_id: int, message: dict):
        """
        Broadcast message to all projects owned by a user.
        
        Args:
            user_id: ID of the user
            message: JSON-serializable message to send
        """
        # This would require tracking user_id -> project_id mappings
        # For now, we use project-level broadcasting
        pass


# Global connection manager instance
manager = ConnectionManager()
