"""
FastAPI application entry point
MongoDB Atlas Vector Search RAG backend with Google Gemini embeddings
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import get_settings
from app.routes import notes
from app.services.mongodb_service import mongodb_service
from app.models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting up application...")
    try:
        await mongodb_service.connect()
        logger.info("✓ MongoDB connected")
    except Exception as e:
        logger.error(f"✗ Failed to connect to MongoDB: {str(e)}")
        logger.warning("⚠️  Application will start without MongoDB connection")
        logger.warning("   This is a DNS resolution issue (cannot open /etc/resolv.conf)")
        logger.warning("   The app will run but database operations will fail")
        logger.warning("   To fix: Check your system's DNS configuration or use direct MongoDB URI")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    try:
        await mongodb_service.disconnect()
        logger.info("✓ MongoDB disconnected")
    except Exception as e:
        logger.error(f"Error disconnecting MongoDB: {str(e)}")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="MongoDB Atlas Vector Search RAG API with Google Gemini Embeddings",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(notes.router)


@app.get(
    "/",
    response_model=dict,
    summary="Root endpoint",
    description="API information and documentation links"
)
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Check API and service health status"
)
async def health_check():
    """
    Health check endpoint
    
    Returns the status of the API and connected services
    """
    mongodb_connected = await mongodb_service.is_connected()
    gemini_configured = bool(settings.gemini_api_key)
    
    return HealthResponse(
        status="healthy" if mongodb_connected and gemini_configured else "degraded",
        version=settings.app_version,
        mongodb_connected=mongodb_connected,
        openai_configured=gemini_configured
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
