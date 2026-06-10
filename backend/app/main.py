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
    import logging
    
    logging.info("Background Task: Refund Loop started.")
    semaphore = asyncio.Semaphore(5)
    
    async def safe_refund(wallet):
        async with semaphore:
            return await auto_refund_session(wallet)
            
    while True:
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                # Fetch users who have recently transacted or all users to check
                users = await conn.fetch("SELECT wallet_address FROM users")
                await asyncio.gather(*[safe_refund(row['wallet_address']) for row in users])
                    
        except Exception as e:
            logging.error(f"Refund loop error: {e}")
            
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
async def security_and_log_middleware(request: Request, call_next):
    """
    Combined middleware for:
    1. Request logging
    2. Security headers injection (prevents clickjacking, MIME sniffing, XSS)
    3. CORS failsafe (manual header injection if CORSMiddleware missed it)
    4. Server header suppression (don't leak backend version info)
    """
    print(f"Request: {request.method} {request.url}")
    response = await call_next(request)

    # ── Security Headers ─────────────────────────────────────────
    # Prevent this page from being embedded in iframes (clickjacking)
    response.headers["X-Frame-Options"] = "DENY"
    # Prevent browsers from guessing content types (MIME sniffing attack)
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Legacy XSS filter (for older browsers)
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Don't leak full URL in Referer header to third-party sites
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Don't tell attackers what server/version is running
    response.headers["Server"] = "PayPerAI"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; connect-src 'self' https://testnet-api.algonode.cloud; script-src 'self' 'unsafe-inline'"

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
