"""
Image generation and NFT minting endpoints.
Balance checks are now on-chain via smart contract escrow.
NFT metadata is stored in PostgreSQL for fast retrieval.

Security: All write endpoints now require SIWA JWT authentication.
Scaling: Rate limiting added to prevent AI generation abuse.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, validator
from typing import Optional
import uuid
import hashlib

from app.services.ai_service import generate_ai_image, SERVICE_CATALOG
from app.services.algorand_service import mint_image_nft, transfer_asset
from app.database import (
    get_wallet_balance, add_message, create_conversation,
    get_conversation, log_transaction, log_ai_query, save_nft_metadata
)
from app.core.security import get_current_user
from app.core.limiter import limiter

router = APIRouter(tags=["Images"])

class ImageGenerateIn(BaseModel):
    wallet_address: str
    prompt: str
    conversation_id: Optional[str] = None

    @validator('prompt')
    def validate_prompt(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Prompt cannot be empty")
        if len(v) > 500:
            raise ValueError("Image prompt must be 500 characters or less")
        return v

class ImageMintIn(BaseModel):
    wallet_address: str
    image_url: str
    prompt: str

class ImageTransferIn(BaseModel):
    wallet_address: str
    asset_id: int

@router.post("/images/generate")
@limiter.limit("5/minute")
async def generate_image_endpoint(
    request: Request,
    data: ImageGenerateIn,
    wallet_address: str = Depends(get_current_user)
):
    """
    Generate an AI image. Requires SIWA authentication.
    Uses the JWT-verified wallet address — ignores any wallet_address in the request body
    to prevent a user from generating images charged to another wallet.
    """
    service_id = "image_studio"

    # 1. Check on-chain balance (smart contract escrow)
    balance = await get_wallet_balance(wallet_address)
    cost = SERVICE_CATALOG[service_id]["price_microalgo"]

    if balance < cost:
        raise HTTPException(status_code=402, detail="Insufficient balance to generate AI image. 2.0 ALGO required.")

    # 2. Setup Conversation
    conv_id = data.conversation_id or str(uuid.uuid4())
    if not data.conversation_id:
        await create_conversation(conv_id, service_id, wallet_address)

    # 3. Generate Image (no backend deduction — that's on-chain)
    try:
        # Save user prompt
        await add_message(conv_id, "user", data.prompt)

        image_url = await generate_ai_image(data.prompt)

        # Save AI response
        await add_message(conv_id, "assistant", f"[IMAGE]{image_url}", tokens_used=1000, cost_usd=0.04)

        # Log usage to PostgreSQL audit trail
        prompt_hash = hashlib.sha256(data.prompt.encode()).hexdigest()
        response_hash = hashlib.sha256(image_url.encode()).hexdigest()

        await log_transaction(
            wallet_address=wallet_address,
            tx_type="image_generation",
            amount_microalgo=cost,
            description=f"AI image generation: {data.prompt[:50]}"
        )

        await log_ai_query(
            wallet_address=wallet_address,
            service_id=service_id,
            prompt_hash=prompt_hash,
            response_hash=response_hash,
            tokens_used=1000,
            conversation_id=conv_id,
        )

        return {
            "conversation_id": conv_id,
            "image_url": image_url,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images/mint")
@limiter.limit("3/minute")
async def mint_image_endpoint(
    request: Request,
    data: ImageMintIn,
    wallet_address: str = Depends(get_current_user)
):
    """Mint an NFT for the generated image. Requires SIWA authentication."""
    try:
        asset_id = await mint_image_nft(wallet_address, data.image_url, data.prompt)

        # Log NFT minting event
        await log_transaction(
            wallet_address=wallet_address,
            tx_type="nft_mint",
            amount_microalgo=0,
            description=f"NFT minted: asset_id={asset_id}"
        )

        return {
            "asset_id": asset_id,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/images/transfer")
@limiter.limit("3/minute")
async def transfer_image_endpoint(
    request: Request,
    data: ImageTransferIn,
    wallet_address: str = Depends(get_current_user)
):
    """Transfer an NFT to the authenticated user's wallet. Requires SIWA authentication."""
    try:
        txid = await transfer_asset(wallet_address, data.asset_id)

        # Log NFT transfer event
        await log_transaction(
            wallet_address=wallet_address,
            tx_type="nft_transfer",
            amount_microalgo=0,
            description=f"NFT transferred: asset_id={data.asset_id}, txid={txid}"
        )

        return {
            "txid": txid,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
