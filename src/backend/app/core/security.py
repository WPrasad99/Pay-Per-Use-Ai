"""
Security module for PayPerAI.
Implements Sign-In with Algorand (SIWA) using signed transaction verification.

The signed transaction msgpack structure (raw bytes):
  {
    b'sig': <64-byte ed25519 signature>,
    b'txn': {
      b'snd': <32-byte sender public key>,
      b'note': <note bytes>,
      ...
    }
  }

We decode this directly with msgpack (raw=True) to avoid algosdk's
base64 string encoding, which caused the previous verification issues.
"""
import secrets
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Cookie, HTTPException, status, Header
from jose import JWTError, jwt
import msgpack

from app.config import settings

# ── Constants ──────────────────────────────────────────────
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
# ── Nonce helpers ────────────────────────────────────────────
# Now uses PostgreSQL (database.py) instead of in-memory dicts to support multi-worker environments.

async def generate_nonce(wallet_address: str) -> str:
    from app.database import save_nonce
    nonce = secrets.token_hex(16)
    expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
    await save_nonce(wallet_address, nonce, expiry)
    return nonce


async def get_pending_nonce(wallet_address: str) -> Optional[str]:
    from app.database import get_nonce
    data = await get_nonce(wallet_address)
    return data["nonce"] if data else None


async def get_pending_nonce_expiry(wallet_address: str) -> Optional[float]:
    from app.database import get_nonce
    data = await get_nonce(wallet_address)
    if data and data["expires_at"]:
        return data["expires_at"].timestamp()
    return None


async def consume_nonce(wallet_address: str):
    from app.database import delete_nonce
    await delete_nonce(wallet_address)


# ── Signed Transaction Verification ─────────────────────────

def verify_signed_transaction(wallet_address: str, nonce: str, signed_txn_b64: str) -> bool:
    """
    Verify a signed Algorand transaction (0-ALGO self-transfer).

    Decodes the raw msgpack bytes directly (avoiding algosdk encoding issues)
    and checks:
      1. Transaction has a signature (user actually approved in Pera)
      2. Sender public key matches wallet_address
      3. Note field contains the nonce
    """
    try:
        from algosdk import encoding

        raw_bytes = base64.b64decode(signed_txn_b64)

        # Decode msgpack with raw=True to get binary keys and values
        decoded = msgpack.unpackb(raw_bytes, raw=True)

        # ── Check 1: Has a signature ───────────────────────────────────
        sig_bytes = decoded.get(b'sig')
        if not sig_bytes or len(sig_bytes) != 64:
            return False

        # ── Check 2: Sender matches wallet_address ─────────────────────
        txn_dict = decoded.get(b'txn', {})
        snd_bytes = txn_dict.get(b'snd')  # 32-byte raw public key
        if not snd_bytes:
            return False

        # Convert 32-byte public key to base32 Algorand address for comparison
        sender_address = encoding.encode_address(snd_bytes)
        if sender_address != wallet_address:
            return False

        # ── Check 3: Note contains the nonce ──────────────────────────
        note_bytes = txn_dict.get(b'note', b'')
        note_str = note_bytes.decode('utf-8', errors='replace') if note_bytes else ''
        if nonce not in note_str:
            return False

        return True

    except Exception:
        return False


# ── JWT helpers ──────────────────────────────────────────────

def create_access_token(wallet_address: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": wallet_address, "exp": expire}
    return jwt.encode(payload, settings.app_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.app_secret_key, algorithms=[ALGORITHM])
        wallet: str = payload.get("sub")
        if not wallet:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return wallet
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again."
        )


# ── FastAPI Dependency ────────────────────────────────────────

def get_current_user(
    access_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None)
) -> str:
    token = access_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please sign in."
        )
    return decode_access_token(token)
