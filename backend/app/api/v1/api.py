"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    plants,
    categories,
    best_practices,
    benchmarking,
    copy_implement,
    questions,
    leaderboard,
    analytics,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(plants.router, prefix="/plants", tags=["Plants"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(best_practices.router, prefix="/best-practices", tags=["Best Practices"])
api_router.include_router(benchmarking.router, prefix="/benchmarking", tags=["Benchmarking"])
api_router.include_router(copy_implement.router, prefix="/copy", tags=["Copy & Implement"])
api_router.include_router(questions.router, prefix="/questions", tags=["Questions"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

