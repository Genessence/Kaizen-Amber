"""WebSocket endpoints for real-time notifications."""

import asyncio
import json
from datetime import datetime
from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect, Query, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.core.websocket_manager import websocket_manager
from app.database import SessionLocal
from app.models.user import User


async def get_user_from_token(token: str) -> User:
    """Authenticate user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    try:
        payload = verify_token(token, token_type="access")
        if payload is None:
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # Get database session
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == UUID(user_id)).first()
            if user is None or not user.is_active:
                raise credentials_exception
            return user
        finally:
            db.close()
    
    except (JWTError, ValueError):
        raise credentials_exception


async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time notifications.
    
    Query parameter:
    - token: JWT access token for authentication
    """
    # Authenticate user
    try:
        user = await get_user_from_token(token)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Accept connection
    await websocket.accept()
    
    # Add to connection manager
    await websocket_manager.connect(user.id, websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connection established",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                # Wait for messages (ping/pong or other commands)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type")
                    
                    if message_type == "ping":
                        # Respond to ping with pong
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    elif message_type == "pong":
                        # Acknowledge pong
                        pass
                    else:
                        # Unknown message type, ignore
                        pass
                
                except json.JSONDecodeError:
                    # Invalid JSON, ignore
                    pass
            
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except:
                    # Connection is dead, break loop
                    break
    
    except WebSocketDisconnect:
        # Client disconnected normally
        pass
    except Exception as e:
        # Connection error
        print(f"WebSocket error for user {user.id}: {e}")
    finally:
        # Remove from connection manager
        await websocket_manager.disconnect(user.id, websocket)

