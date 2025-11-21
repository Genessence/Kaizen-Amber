"""FastAPI application entry point."""

from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints.websocket import websocket_notifications

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Amber Best Practice & Benchmarking Portal",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # <-- VERY IMPORTANT
    allow_headers=["*"],
)



@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return JSONResponse(
        content={
            "success": True,
            "message": f"{settings.APP_NAME} API is running",
            "version": settings.APP_VERSION,
        }
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return JSONResponse(
        content={
            "success": True,
            "status": "healthy",
            "version": settings.APP_VERSION,
        }
    )


# Include API router
app.include_router(api_router, prefix="/api/v1")

# Add WebSocket endpoint (must be registered before router or separately)
@app.websocket("/api/v1/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """WebSocket endpoint wrapper."""
    await websocket_notifications(websocket, token)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )

