"""
Creator API Routes — Profile management, API key management, earnings.

Endpoints:
- POST   /api/v1/creators/profile          — Create/update creator profile
- GET    /api/v1/creators/{wallet}          — Get public creator profile
- GET    /api/v1/creators/{wallet}/agents   — List creator's agents
- GET    /api/v1/creators/{wallet}/earnings — Earnings summary
- GET    /api/v1/creators/{wallet}/analytics — Full analytics
- POST   /api/v1/creators/api-keys          — Store encrypted API key
- GET    /api/v1/creators/api-keys/status/{wallet} — Check key status
- DELETE /api/v1/creators/api-keys/{wallet}/{provider} — Delete key
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app import database as db
from app.core.encryption import encrypt_api_key, get_key_hint

router = APIRouter(tags=["Creators"])


# ── Request Models ────────────────────────────────────

class CreateProfileIn(BaseModel):
    wallet_address: str
    display_name: str
    bio: Optional[str] = ""
    avatar_url: Optional[str] = ""
    social_twitter: Optional[str] = ""
    social_github: Optional[str] = ""
    social_website: Optional[str] = ""


class SaveApiKeyIn(BaseModel):
    wallet_address: str
    provider: str  # openai, groq, gemini, huggingface
    api_key: str   # Plaintext — will be encrypted before storage


# ── Profile Routes ────────────────────────────────────

@router.post("/profile")
async def create_or_update_profile(data: CreateProfileIn):
    """Create or update a creator profile. DID is auto-generated."""
    if not data.wallet_address:
        raise HTTPException(status_code=400, detail="Wallet address required")
    if not data.display_name or len(data.display_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Display name must be at least 2 characters")

    result = await db.create_creator_profile(
        wallet_address=data.wallet_address,
        display_name=data.display_name.strip(),
        bio=data.bio or "",
        avatar_url=data.avatar_url or "",
        social_twitter=data.social_twitter or "",
        social_github=data.social_github or "",
        social_website=data.social_website or "",
    )
    return {"status": "success", **result}


@router.get("/{wallet}")
async def get_profile(wallet: str):
    """Get public creator profile."""
    profile = await db.get_creator_profile(wallet)
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return profile


@router.get("/{wallet}/agents")
async def get_creator_agents(wallet: str):
    """List all agents created by this creator."""
    agents = await db.get_creator_agents(wallet)
    return {"agents": agents}


@router.get("/{wallet}/earnings")
async def get_earnings(wallet: str):
    """Get creator earnings summary."""
    profile = await db.get_creator_profile(wallet)
    if not profile:
        raise HTTPException(status_code=404, detail="Creator not found")

    summary = await db.get_creator_earnings_summary(wallet)
    history = await db.get_creator_earnings_history(wallet, limit=20)
    return {
        "summary": summary,
        "history": history,
    }


@router.get("/{wallet}/analytics")
async def get_analytics(wallet: str):
    """Get full creator analytics."""
    profile = await db.get_creator_profile(wallet)
    if not profile:
        raise HTTPException(status_code=404, detail="Creator not found")

    analytics = await db.get_creator_analytics(wallet)
    earnings = await db.get_creator_earnings_summary(wallet)
    agents = await db.get_creator_agents(wallet)

    return {
        "profile": profile,
        "analytics": analytics,
        "earnings": earnings,
        "agents_count": len(agents),
    }


# ── API Key Routes ────────────────────────────────────

@router.post("/api-keys")
async def save_api_key(data: SaveApiKeyIn):
    """
    Store a creator's API key (encrypted with AES-256-GCM).
    The plaintext key is encrypted before storage and NEVER returned.
    """
    valid_providers = {"openai", "groq", "gemini", "huggingface"}
    if data.provider not in valid_providers:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
        )
    if not data.api_key or len(data.api_key.strip()) < 10:
        raise HTTPException(status_code=400, detail="API key too short")

    # Verify creator profile exists
    profile = await db.get_creator_profile(data.wallet_address)
    if not profile:
        raise HTTPException(status_code=404, detail="Create a creator profile first")

    # Encrypt and store
    encrypted = encrypt_api_key(data.api_key.strip())
    hint = get_key_hint(data.api_key.strip())

    await db.save_creator_api_key(
        creator_wallet=data.wallet_address,
        provider=data.provider,
        encrypted_key=encrypted,
        key_hint=hint,
    )

    return {
        "status": "success",
        "provider": data.provider,
        "key_hint": hint,
        "message": "API key encrypted and stored securely"
    }


@router.get("/api-keys/status/{wallet}")
async def get_api_key_status(wallet: str):
    """Check which providers have keys saved (without revealing keys)."""
    keys = await db.get_creator_api_key_status(wallet)
    return {"keys": keys}


@router.delete("/api-keys/{wallet}/{provider}")
async def delete_api_key(wallet: str, provider: str):
    """Delete a stored API key."""
    await db.delete_creator_api_key(wallet, provider)
    return {"status": "deleted", "provider": provider}
