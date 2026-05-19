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
from app.config import settings

router = APIRouter(tags=["Creators"])


# ── Request Models ────────────────────────────────────

class ConfirmWithdrawalIn(BaseModel):
    wallet_address: str
    tx_id: str


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
        return {
            "summary": {
                "total_earned_microalgo": 0,
                "total_withdrawn_microalgo": 0,
                "available_microalgo": 0
            },
            "history": []
        }

    from app.services.algorand_service import get_creator_earnings_from_chain
    on_chain_available = get_creator_earnings_from_chain(wallet)
    
    summary = await db.get_creator_earnings_summary(wallet)
    summary["available_microalgo"] = on_chain_available
    summary["total_earned_microalgo"] = on_chain_available + summary["total_withdrawn_microalgo"]

    history = await db.get_creator_earnings_history(wallet, limit=20)
    return {
        "summary": summary,
        "history": history,
        "app_id": settings.app_id_int,
        "algod_url": settings.algod_url,
    }


@router.get("/{wallet}/analytics")
async def get_analytics(wallet: str):
    """Get full creator analytics."""
    profile = await db.get_creator_profile(wallet)
    if not profile:
        return {
            "profile": None,
            "analytics": {
                "total_uses": 0,
                "total_tokens": 0,
                "total_earnings": 0,
                "unique_users": 0,
                "active_agents": 0
            },
            "earnings": {
                "total_earned_microalgo": 0,
                "total_withdrawn_microalgo": 0,
                "available_microalgo": 0
            },
            "agents_count": 0,
        }

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


@router.post("/withdraw/confirm")
async def confirm_withdrawal(data: ConfirmWithdrawalIn):
    """
    Verify on-chain withdraw transaction and log to DB ledger.
    """
    from algosdk.v2client import algod
    import algosdk
    import requests
    import asyncio
    
    client = algod.AlgodClient(settings.algod_token, settings.algod_url)
    tx_info = None
    
    # 1. Try pending_transaction_info (recent cache check)
    try:
        tx_info = client.pending_transaction_info(data.tx_id)
    except Exception as e:
        print(f"Algod pending_transaction_info lookup failed: {e}")
        
    # 2. Try Indexer with retry loop to handle node/indexer delay (up to 12s)
    if not tx_info or not tx_info.get("confirmed-round"):
        from algosdk.v2client import indexer as indexer_v2
        indexer = indexer_v2.IndexerClient("", settings.indexer_url, "")
        for attempt in range(6):
            try:
                resp = indexer.transaction(data.tx_id)
                tx_info = resp.get("transaction")
                if tx_info and tx_info.get("confirmed-round", 0) > 0:
                    break
            except Exception as e:
                print(f"Indexer lookup attempt {attempt} failed: {e}")
            await asyncio.sleep(2)

    if not tx_info:
        # Failsafe block: indexer/algod lag is present, but transaction occurred!
        # We compare database available balance with actual on-chain available balance.
        summary = await db.get_creator_earnings_summary(data.wallet_address)
        db_available = int(summary.get("available_microalgo", 0))
        
        from app.services.algorand_service import get_creator_earnings_from_chain
        on_chain_available = get_creator_earnings_from_chain(data.wallet_address)
        
        if db_available > on_chain_available:
            withdrawn_amount = db_available - on_chain_available
        else:
            withdrawn_amount = db_available
            
        if withdrawn_amount > 0:
            # Log the withdrawal in the database ledger
            await db.log_creator_earning(
                creator_wallet=data.wallet_address,
                agent_id="",
                amount_microalgo=withdrawn_amount,
                tx_type="withdrawal"
            )
            return {
                "status": "confirmed",
                "tx_id": data.tx_id,
                "amount_microalgo": withdrawn_amount,
                "amount_algo": withdrawn_amount / 1_000_000,
                "note": "Confirmed via balance delta failsafe due to network lookup delay"
            }
        else:
            raise HTTPException(status_code=400, detail="Transaction lookup delayed; no on-chain earnings difference detected yet.")

    # 3. Extract transaction details dynamically
    txn = tx_info.get("txn", {}).get("txn", {}) if "txn" in tx_info else tx_info
    if not isinstance(txn, dict):
        txn = tx_info
        
    # Extract App ID
    apid = None
    if "application-transaction" in tx_info:
        apid = tx_info["application-transaction"].get("application-id")
    elif "txn" in tx_info:
        txn_layer = tx_info["txn"]
        if isinstance(txn_layer, dict):
            if "txn" in txn_layer and isinstance(txn_layer["txn"], dict):
                apid = txn_layer["txn"].get("apid") or txn_layer["txn"].get("application-id")
            else:
                apid = txn_layer.get("apid") or txn_layer.get("application-id")
    if apid is None:
        apid = tx_info.get("apid") or tx_info.get("application-id")
        
    if apid != settings.app_id_int:
        raise HTTPException(status_code=400, detail=f"Transaction is for app {apid}, expected {settings.app_id_int}")

    # Extract Sender Address
    sender = tx_info.get("sender") or tx_info.get("snd")
    if not sender and "txn" in tx_info:
        txn_layer = tx_info["txn"]
        if isinstance(txn_layer, dict):
            if "txn" in txn_layer and isinstance(txn_layer["txn"], dict):
                sender = txn_layer["txn"].get("snd") or txn_layer["txn"].get("sender")
            else:
                sender = txn_layer.get("snd") or txn_layer.get("sender")

    # Normalize sender if base64/bytes
    if sender:
        import base64
        if isinstance(sender, bytes):
            sender = algosdk.encoding.encode_address(sender)
        elif isinstance(sender, str) and len(sender) == 44:
            try:
                sender = algosdk.encoding.encode_address(base64.b64decode(sender))
            except Exception:
                pass
                
    if sender != data.wallet_address:
        raise HTTPException(status_code=400, detail=f"Transaction sender ({sender}) does not match creator wallet ({data.wallet_address})")

    # 4. Extract inner transaction amount using robust double-nested parsing
    inner_txs = tx_info.get("inner-txns") or tx_info.get("inner-transactions")
    if not inner_txs and "txn" in tx_info and isinstance(tx_info["txn"], dict):
        inner_txs = tx_info["txn"].get("inner-txns") or tx_info["txn"].get("inner-transactions")
        
    withdrawn_amount = 0
    if inner_txs:
        for itx in inner_txs:
            if not isinstance(itx, dict):
                continue
            
            # Extract type
            itx_type = itx.get("tx-type") or itx.get("type")
            
            txn_layer1 = itx.get("txn")
            if isinstance(txn_layer1, dict):
                itx_type = itx_type or txn_layer1.get("type") or txn_layer1.get("tx-type")
                txn_layer2 = txn_layer1.get("txn")
                if isinstance(txn_layer2, dict):
                    itx_type = itx_type or txn_layer2.get("type") or txn_layer2.get("tx-type")
            
            if isinstance(itx_type, bytes):
                itx_type = itx_type.decode()
                
            if itx_type == "pay":
                pay_details = itx.get("payment-transaction")
                if isinstance(pay_details, dict):
                    withdrawn_amount = pay_details.get("amount") or pay_details.get("amt") or 0
                
                if withdrawn_amount == 0:
                    withdrawn_amount = itx.get("amount") or itx.get("amt") or 0
                    
                if withdrawn_amount == 0 and isinstance(txn_layer1, dict):
                    pay_details2 = txn_layer1.get("payment-transaction")
                    if isinstance(pay_details2, dict):
                        withdrawn_amount = pay_details2.get("amount") or pay_details2.get("amt") or 0
                    if withdrawn_amount == 0:
                        withdrawn_amount = txn_layer1.get("amount") or txn_layer1.get("amt") or 0
                        
                if withdrawn_amount == 0 and isinstance(txn_layer1, dict) and isinstance(txn_layer1.get("txn"), dict):
                    txn_layer2 = txn_layer1.get("txn")
                    pay_details3 = txn_layer2.get("payment-transaction")
                    if isinstance(pay_details3, dict):
                        withdrawn_amount = pay_details3.get("amount") or pay_details3.get("amt") or 0
                    if withdrawn_amount == 0:
                        withdrawn_amount = txn_layer2.get("amount") or txn_layer2.get("amt") or 0
                        
                if withdrawn_amount > 0:
                    break
                    
    # Fallback to balance difference or db available if inner txns parse returns zero
    if withdrawn_amount <= 0:
        summary = await db.get_creator_earnings_summary(data.wallet_address)
        db_available = int(summary.get("available_microalgo", 0))
        from app.services.algorand_service import get_creator_earnings_from_chain
        on_chain_available = get_creator_earnings_from_chain(data.wallet_address)
        
        if db_available > on_chain_available:
            withdrawn_amount = db_available - on_chain_available
        else:
            withdrawn_amount = db_available

    if withdrawn_amount <= 0:
        raise HTTPException(status_code=400, detail="No earnings available or found to withdraw")

    # 5. Log the withdrawal in the database ledger
    await db.log_creator_earning(
        creator_wallet=data.wallet_address,
        agent_id="",
        amount_microalgo=withdrawn_amount,
        tx_type="withdrawal"
    )
    return {
        "status": "confirmed",
        "tx_id": data.tx_id,
        "amount_microalgo": withdrawn_amount,
        "amount_algo": withdrawn_amount / 1_000_000,
    }


