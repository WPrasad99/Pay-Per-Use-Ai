"""
SIWA auth routes — uses signData (message signing, no transaction).
Backend tries multiple ed25519 prefixes to handle Pera Wallet v1.5.x.
"""
from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel
from datetime import datetime, timezone

from app.core.security import (
    generate_nonce, get_pending_nonce, get_pending_nonce_expiry,
    consume_nonce, create_access_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


class VerifyIn(BaseModel):
    wallet_address: str
    message: str    # The exact message that was signed
    signature: str  # Base64 ed25519 signature from Pera Wallet signData


def _verify_with_prefix(pk_bytes: bytes, prefix: bytes, msg_bytes: bytes, sig_bytes: bytes) -> bool:
    from algosdk.util import VerifyKey
    from nacl.exceptions import BadSignatureError
    try:
        VerifyKey(pk_bytes).verify(prefix + msg_bytes, sig_bytes)
        return True
    except (BadSignatureError, Exception):
        return False


def verify_message_signature(wallet_address: str, message: str, sig_b64: str) -> bool:
    """
    Try all known Algorand message prefixes until one verifies correctly.
    Pera Wallet signData uses the standard 'MX' prefix from algosdk.
    """
    import base64
    from algosdk import encoding
    try:
        pk_bytes  = encoding.decode_address(wallet_address)
        sig_bytes = base64.b64decode(sig_b64)
        msg_bytes = message.encode("utf-8")
        # Try every known prefix Pera Wallet might use
        for prefix in [b"MX", b"", b"arc0060", b"AX", b"TX"]:
            if _verify_with_prefix(pk_bytes, prefix, msg_bytes, sig_bytes):
                return True
        return False
    except Exception:
        return False


@router.get("/nonce")
async def get_nonce(wallet: str):
    if not wallet or len(wallet) != 58:
        raise HTTPException(status_code=400, detail="Invalid wallet address")
    nonce = await generate_nonce(wallet)
    return {"nonce": nonce, "wallet_address": wallet}


@router.post("/verify")
async def verify_signature(data: VerifyIn, response: Response):
    # 1. Check nonce exists and is fresh
    nonce = await get_pending_nonce(data.wallet_address)
    if nonce is None:
        raise HTTPException(status_code=400, detail="No pending sign-in. Request a nonce first.")
    expiry = await get_pending_nonce_expiry(data.wallet_address)
    if expiry and datetime.now(timezone.utc).timestamp() > expiry:
        await consume_nonce(data.wallet_address)
        raise HTTPException(status_code=400, detail="Nonce expired. Please try again.")

    # 2. Verify nonce is in the message
    if nonce not in data.message:
        raise HTTPException(status_code=401, detail="Message does not contain the expected nonce.")

    # 3. Verify ed25519 signature (tries MX, arc0060, raw, etc.)
    if not verify_message_signature(data.wallet_address, data.message, data.signature):
        raise HTTPException(status_code=401, detail="Invalid signature. Wallet verification failed.")

    # 4. Consume nonce (anti-replay)
    await consume_nonce(data.wallet_address)

    # 5. Issue JWT HttpOnly cookie
    token = create_access_token(data.wallet_address)
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, samesite="none", secure=True,
        max_age=86400, path="/",
    )
    return {"wallet_address": data.wallet_address, "authenticated": True}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", samesite="none", secure=True)
    return {"message": "Logged out successfully"}
