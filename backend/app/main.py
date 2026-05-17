"""
FastAPI application core.
Initializes the router configuration, database, and health endpoints.
Starts the blockchain event listener on startup.
Adds SIWA auth routes and rate limiting.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import asyncio
import os

from app.config import settings
from app.database import init_db
from app.routes import services, payment, query, chat, wallet, image, marketplace, users
from app.routes.auth import router as auth_router
from app.routes.session import router as session_router
from app.routes.creators import router as creators_router
from app.routes.agents import router as agents_router
from app.core.limiter import limiter


async def refund_loop():
    """
    Background task that periodically checks for expired sessions
    and calls the smart contract to return unspent ALGO to users.
    """
    from app.services.algorand_service import auto_refund_session
    from app.database import get_pool
    import time
    
    print("Background Task: Refund Loop started.")
    while True:
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                # We check all users who have registered to see if they have expired sessions on-chain
                # In a large scale app, we would only check 'active' users from a sessions table.
                users = await conn.fetch("SELECT wallet_address FROM users")
                
                for row in users:
                    wallet = row['wallet_address']
                    # This function internally checks for expiration before sending tx
                    await auto_refund_session(wallet)
                    
        except Exception as e:
            print(f"Refund loop error: {e}")
            
        await asyncio.sleep(300) # Check every 5 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events spanning the duration of the App."""
    await init_db()

    # Start blockchain event listener (oracle pattern)
    from app.services.event_listener import event_listener
    listener_task = asyncio.create_task(event_listener.start())
    
    # Start auto-refund background task
    refund_task = asyncio.create_task(refund_loop())

    print("PayPerAI Backend running")
    print(f"Network: {settings.algorand_network}")
    print(f"Database: PostgreSQL")
    yield

    # Cleanup
    event_listener.stop()
    listener_task.cancel()
    refund_task.cancel()

    # Close database pool
    from app.database import close_pool
    await close_pool()


app = FastAPI(
    title="PayPerAI — Blockchain-Gated AI API",
    version="3.0.0",
    docs_url="/docs",
    lifespan=lifespan
)

# Parse origins from settings
origins = [org.strip() for org in settings.cors_origins.split(",") if org.strip()]
for default_org in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"]:
    if default_org not in origins:
        origins.append(default_org)

# ── CORS & Middleware ────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    # Manual CORS failsafe - only apply if standard middleware did not
    origin = request.headers.get("origin")
    if origin in origins:
        if "Access-Control-Allow-Origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = origin
        if "Access-Control-Allow-Credentials" not in response.headers:
            response.headers["Access-Control-Allow-Credentials"] = "true"
        if "Access-Control-Allow-Methods" not in response.headers:
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        if "Access-Control-Allow-Headers" not in response.headers:
            req_headers = request.headers.get("Access-Control-Request-Headers", "Content-Type, Authorization, X-Requested-With, Accept")
            response.headers["Access-Control-Allow-Headers"] = req_headers
    return response

# ── Rate Limiter ─────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.get("/")
async def root():
    return {
        "message": "PayPerAI Backend API is live!",
        "version": "3.0.0",
        "architecture": "Web3 + SIWA Security",
        "docs": "/docs",
        "health": "/health"
    }


# ── Auth Routes (SIWA) ───────────────────────────────────────
app.include_router(auth_router, prefix="/api/v1")

# ── Feature Routes ───────────────────────────────────────────
app.include_router(services.router, prefix="/api/v1")
app.include_router(payment.router, prefix="/api/v1")
app.include_router(query.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
app.include_router(image.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(session_router, prefix="/api/v1")

# ── Marketplace Routes ───────────────────────────────────────
app.include_router(creators_router, prefix="/api/v1/creators")
app.include_router(agents_router, prefix="/api/v1/agents")

# ── Static Files ─────────────────────────────────────────────
os.makedirs("static/nfts", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": "3.0.0",
        "architecture": "web3+siwa",
        "database": "postgresql",
        "network": settings.algorand_network,
        "app_id": settings.algorand_app_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
