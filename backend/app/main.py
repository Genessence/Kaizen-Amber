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
# IMPORTANT: When allow_credentials=True, allow_origins CANNOT be ["*"]
# It must be a specific list of origins. This is a browser security requirement.
cors_origins = settings.CORS_ORIGINS

# Validate that CORS_ORIGINS doesn't contain "*" when credentials are enabled
if "*" in cors_origins:
    raise ValueError(
        "CORS_ORIGINS cannot contain '*' when allow_credentials=True. "
        "Please specify exact origins in your .env file: "
        "CORS_ORIGINS=[\"http://localhost:8080\",\"http://localhost:5173\"]"
    )

# Ensure CORS_ORIGINS is a list
if not isinstance(cors_origins, list):
    raise ValueError(f"CORS_ORIGINS must be a list, got {type(cors_origins)}")

print(f"[CORS] Configuring CORS with origins: {cors_origins}")
print(f"[CORS] allow_credentials: True")
print(f"[CORS] allow_methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")

# Add CORS middleware - MUST be added BEFORE routes are included
# FastAPI's CORSMiddleware automatically handles OPTIONS preflight requests
# Note: allow_headers=["*"] should work, but being explicit can help with some browsers
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Must be specific origins, not ["*"]
    allow_credentials=True,  # Required for cookies/auth headers, but incompatible with "*"
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
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

