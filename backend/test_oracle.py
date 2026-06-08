import asyncio
from app.services.price_oracle import get_algo_usd_price

async def main():
    price = await get_algo_usd_price()
    print(f"ALGO Price in USD: ${price}")

if __name__ == "__main__":
    asyncio.run(main())
