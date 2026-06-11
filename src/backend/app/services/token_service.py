"""
Abstracts token identifier generation and temporal validity checks.
All actual database operations remain in database.py.
"""
import uuid
from datetime import datetime, timedelta, timezone

def generate_session_id() -> str:
    """
    Produces a cryptographically secure random session UUID string.
    """
    return str(uuid.uuid4())

def generate_expiry(seconds: int = 600) -> str:
    """
    Creates an ISO 8601 string offset into the future.
    """
    expiry_time = datetime.now(timezone.utc) + timedelta(seconds=seconds)
    return expiry_time.isoformat()

def is_session_expired(expires_at: str) -> bool:
    """
    Validates if an ISO string representing expiry is past current UTC time.
    """
    try:
        expires_time = datetime.fromisoformat(expires_at)
        return datetime.now(timezone.utc) > expires_time
    except ValueError:
        return True
