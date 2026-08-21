
import logging
import os

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import Base, engine
import app.models

from app.routes import (
    auth_routes, rbac_routes, session_routes, profile_routes, address_routes,
    destination_routes, category_routes, operator_routes, tour_package_routes, tour_schedule_routes,
    hotel_routes, room_routes, hotel_search_routes, tour_search_routes,
    hotel_booking_routes, tour_booking_routes, activity_routes, itinerary_routes,
    wishlist_routes, review_routes, payment_routes, transaction_routes, refund_routes,
    coupon_routes, membership_routes, ai_chat_routes, ai_itinerary_routes, ai_recommendation_routes,
    maps_routes, travel_guide_routes, transport_routes, agent_routes, lead_routes, dashboard_routes,
    notification_routes, message_routes, support_routes, document_routes, insurance_routes,
    report_routes, analytics_routes, ai_insight_routes, admin_routes, audit_routes, settings_routes,
)

logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG,
                    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("travelmate")

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise Travel Booking & Tour Management Platform — FastAPI backend.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Returns a clean, frontend-friendly shape instead of FastAPI's default verbose 422 body."""
    errors = [{"field": ".".join(
        str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": "Validation failed", "errors": errors})


@app.on_event("startup")
def on_startup() -> None:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.error("Could not connect to the database on startup: %s", exc)
        logger.error(
            "Check DATABASE_URL in your .env file — the API will still boot, but DB-backed routes will fail.")


os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


API = settings.API_PREFIX
for router in (
    auth_routes.router, rbac_routes.router, session_routes.router, profile_routes.router, address_routes.router,
    destination_routes.router, category_routes.router, operator_routes.router, tour_package_routes.router,
    tour_schedule_routes.router, hotel_search_routes.router, hotel_routes.router, room_routes.router,
    tour_search_routes.router, hotel_booking_routes.router, tour_booking_routes.router, activity_routes.router,
    itinerary_routes.router, wishlist_routes.router, review_routes.router, payment_routes.router,
    transaction_routes.router, refund_routes.router, coupon_routes.router, membership_routes.router,
    ai_chat_routes.router, ai_itinerary_routes.router, ai_recommendation_routes.router, maps_routes.router,
    travel_guide_routes.router, transport_routes.router, agent_routes.router, lead_routes.router,
    dashboard_routes.router, notification_routes.router, message_routes.router, support_routes.router,
    document_routes.router, insurance_routes.router, report_routes.router, analytics_routes.router,
    ai_insight_routes.router, admin_routes.router, audit_routes.router, settings_routes.router,
):
    app.include_router(router, prefix=API)
