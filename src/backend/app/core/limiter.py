"""
Shared limiter instance to avoid circular imports.
Import this in both main.py and any route that needs rate limiting.

Global default: 60 requests/minute per IP.
Sensitive routes (auth, AI, deposits) have stricter individual limits set per-route.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
