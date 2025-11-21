"""WebSocket connection manager for real-time notifications."""

import asyncio
import json
from typing import Dict, List, Set
from uuid import UUID
from fastapi import WebSocket


class WebSocketManager:
    """Manages WebSocket connections for users."""
    
    def __init__(self):
        # Store connections: {user_id: Set[WebSocket]}
        self._connections: Dict[UUID, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, user_id: UUID, websocket: WebSocket):
        """Add a WebSocket connection for a user."""
        async with self._lock:
            if user_id not in self._connections:
                self._connections[user_id] = set()
            self._connections[user_id].add(websocket)
    
    async def disconnect(self, user_id: UUID, websocket: WebSocket):
        """Remove a WebSocket connection for a user."""
        async with self._lock:
            if user_id in self._connections:
                self._connections[user_id].discard(websocket)
                # Clean up empty sets
                if not self._connections[user_id]:
                    del self._connections[user_id]
    
    async def send_to_user(self, user_id: UUID, message: dict):
        """Send a message to all connections for a specific user."""
        async with self._lock:
            if user_id not in self._connections:
                return
            
            # Get a copy of the set to avoid modification during iteration
            connections = list(self._connections[user_id])
        
        # Send to all connections (outside lock to avoid blocking)
        disconnected = []
        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                # Connection is dead, mark for removal
                disconnected.append(websocket)
        
        # Remove dead connections
        if disconnected:
            async with self._lock:
                if user_id in self._connections:
                    for ws in disconnected:
                        self._connections[user_id].discard(ws)
                    if not self._connections[user_id]:
                        del self._connections[user_id]
    
    async def is_connected(self, user_id: UUID) -> bool:
        """Check if user has any active connections."""
        async with self._lock:
            return user_id in self._connections and len(self._connections[user_id]) > 0
    
    async def get_connected_users(self) -> List[UUID]:
        """Get list of user IDs with active connections."""
        async with self._lock:
            return list(self._connections.keys())
    
    async def broadcast(self, message: dict, exclude_user: UUID = None):
        """Broadcast message to all connected users (except excluded user)."""
        async with self._lock:
            user_ids = [uid for uid in self._connections.keys() if uid != exclude_user]
        
        for user_id in user_ids:
            await self.send_to_user(user_id, message)


# Global instance
websocket_manager = WebSocketManager()

