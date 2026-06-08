import time
import httpx
import asyncio

# In-memory cache to avoid rate limits and latency
_ALGO_USD_CACHE = 0.09 # Default fallback price
_CACHE_TIMESTAMP = 0
_CACHE_TTL_SECONDS = 300  # 5 minutes

async def get_algo_usd_price() -> float:
    """
    Fetches the live ALGO/USD exchange rate from a public API.
    Uses an in-memory cache with a 5-minute TTL to ensure fast responses
    and avoid API rate limiting.
    """
    global _ALGO_USD_CACHE, _CACHE_TIMESTAMP

    now = time.time()
    if now - _CACHE_TIMESTAMP < _CACHE_TTL_SECONDS and _ALGO_USD_CACHE > 0:
        return _ALGO_USD_CACHE

    # Attempt to fetch new price
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # We use CoinGecko as the primary oracle
            url = "https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd"
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                price = data.get("algorand", {}).get("usd")
                if price and price > 0:
                    _ALGO_USD_CACHE = float(price)
                    _CACHE_TIMESTAMP = now
                    return _ALGO_USD_CACHE
    except Exception as e:
        import logging
        logging.error(f"Price Oracle Error: Failed to fetch ALGO price from CoinGecko: {e}")

    # Fallback if primary fails
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Binance as fallback
            url = "https://api.binance.com/api/v3/ticker/price?symbol=ALGOUSDT"
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                price = data.get("price")
                if price:
                    _ALGO_USD_CACHE = float(price)
                    _CACHE_TIMESTAMP = now
                    return _ALGO_USD_CACHE
    except Exception as e:
        import logging
        logging.error(f"Price Oracle Error: Failed to fetch ALGO price from Binance: {e}")

    # If all fail, return the last known cached value (or default 0.09)
    return _ALGO_USD_CACHE
