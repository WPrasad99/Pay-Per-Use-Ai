"""
AES-256-GCM Encryption Service for Creator API Keys.

Security guarantees:
- Keys encrypted at rest using AES-256-GCM (authenticated encryption)
- Unique nonce per encryption operation (prevents replay attacks)
- Encryption secret loaded from environment variable
- Decrypted keys NEVER logged, returned in APIs, or stored in plaintext
- Only decrypted during AI execution inside the gateway
"""
import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_encryption_key() -> bytes:
    """Load the 32-byte encryption key from environment."""
    from app.config import settings
    secret = settings.api_key_encryption_secret
    if not secret:
        # Try dynamically reloading the .env file in case the process was started before the env was updated
        try:
            from dotenv import load_dotenv
            import os
            load_dotenv(override=True)
            secret = os.getenv("API_KEY_ENCRYPTION_SECRET", "")
        except Exception:
            secret = ""

    if not secret:
        raise RuntimeError(
            "FATAL: API_KEY_ENCRYPTION_SECRET is not configured. "
            "Generate a 32-byte hex key with: python -c \"import os; print(os.urandom(32).hex())\""
        )
    try:
        key_bytes = bytes.fromhex(secret)
        if len(key_bytes) != 32:
            raise ValueError("Key must be exactly 32 bytes (64 hex characters)")
        return key_bytes
    except (ValueError, Exception) as e:
        raise RuntimeError(f"Invalid API_KEY_ENCRYPTION_SECRET: {e}")


def encrypt_api_key(plaintext_key: str) -> str:
    """
    Encrypt an API key using AES-256-GCM.
    Returns a base64-encoded string containing: nonce (12 bytes) + ciphertext + tag (16 bytes).
    """
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce, unique per encryption
    ciphertext = aesgcm.encrypt(nonce, plaintext_key.encode('utf-8'), None)
    # Combine nonce + ciphertext for storage
    encrypted_blob = nonce + ciphertext
    return base64.b64encode(encrypted_blob).decode('utf-8')


def decrypt_api_key(encrypted_blob_b64: str) -> str:
    """
    Decrypt an API key from its base64-encoded encrypted blob.
    Returns the plaintext API key string.
    """
    key = _get_encryption_key()
    encrypted_blob = base64.b64decode(encrypted_blob_b64)
    nonce = encrypted_blob[:12]
    ciphertext = encrypted_blob[12:]
    aesgcm = AESGCM(key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode('utf-8')


def get_key_hint(api_key: str) -> str:
    """
    Generate a safe display hint for an API key.
    Shows only the last 4 characters: '...a1b2'
    """
    if len(api_key) < 4:
        return "...****"
    return f"...{api_key[-4:]}"
