import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to sys.path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.config import settings
from app.services.ai_service import SERVICE_CATALOG
from algosdk.v2client.algod import AlgodClient
from algosdk import mnemonic, account
from algosdk.abi import Method
from algosdk.atomic_transaction_composer import AtomicTransactionComposer, AccountTransactionSigner

def register_all():
    load_dotenv()
    
    algod_url = settings.algod_url
    algod_token = settings.algod_token
    app_id = settings.app_id_int
    platform_mnemonic = settings.platform_wallet_mnemonic
    platform_address = settings.platform_wallet_address
    
    if not platform_mnemonic or not app_id:
        print("Missing PLATFORM_WALLET_MNEMONIC or ALGORAND_APP_ID in .env")
        return

    client = AlgodClient(algod_token, algod_url)
    private_key = mnemonic.to_private_key(platform_mnemonic)
    sender = account.address_from_private_key(private_key)
    signer = AccountTransactionSigner(private_key)
    
    params = client.suggested_params()
    
    register_method = Method.from_signature("register_service(string,uint64,address)bool")
    
    print(f"Registering {len(SERVICE_CATALOG)} services to App {app_id}...")
    
    for sid, config in SERVICE_CATALOG.items():
        try:
            atc = AtomicTransactionComposer()
            
            # Use a dummy price of 1 microALGO for the contract price check (legacy)
            # Actual dynamic pricing is handled in request_service_v2
            atc.add_method_call(
                app_id=app_id,
                method=register_method,
                sender=sender,
                sp=params,
                signer=signer,
                method_args=[sid, 1, platform_address],
                boxes=[
                    (app_id, b"c_" + sid.encode('utf-8')),
                    (app_id, b"p_" + sid.encode('utf-8'))
                ]
            )
            
            print(f"  - Registering {sid}...")
            atc.execute(client, 4)
            print(f"  [OK] {sid} registered.")
            
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"  [SKIP] {sid} already registered.")
            else:
                print(f"  [ERROR] {sid}: {e}")

if __name__ == "__main__":
    register_all()
