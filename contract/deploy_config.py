import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from algokit_utils import (
    AlgorandClient,
    AppFactoryCreateMethodCallParams,
)
from algokit_utils.applications.app_spec.arc56 import Arc56Contract

def deploy():
    """
    Deploys the PayPerAI smart contract to Algorand Testnet using modern Algokit AppFactory.
    """
    # Load .env from backend to get the latest credentials
    backend_env = Path(__file__).parent.parent / "backend" / ".env"
    load_dotenv(backend_env)
    
    mnemonic = os.getenv("PLATFORM_WALLET_MNEMONIC")
    if not mnemonic:
        # Fallback to local .env
        load_dotenv()
        mnemonic = os.getenv("PLATFORM_WALLET_MNEMONIC")

    if not mnemonic:
        print("[ERROR] PLATFORM_WALLET_MNEMONIC missing")
        return

    # 1. Connect to Testnet
    algorand = AlgorandClient.testnet()
    # Use keyword argument for from_mnemonic
    deployer = algorand.account.from_mnemonic(mnemonic=mnemonic)
    
    # 2. Load the ARC-56 Contract Spec
    artifact_path = Path(__file__).parent / "smart_contracts" / "pay_per_ai" / "PayPerAI.arc56.json"
    if not artifact_path.exists():
        print(f"[ERROR] Artifact not found at {artifact_path}. Run compile first.")
        return
        
    with open(artifact_path, "r") as f:
        app_spec_json = f.read()
    
    app_spec = Arc56Contract.from_json(app_spec_json)

    # 3. Setup the AppFactory
    factory = algorand.client.get_app_factory(
        app_spec=app_spec,
        default_sender=deployer.address,
        default_signer=deployer.signer
    )

    print(f"Deploying PayPerAI to Testnet as {deployer.address}...")
    
    try:
        # 4. Deploy (Create)
        create_params = AppFactoryCreateMethodCallParams(
            method='create',
            args=[]
        )
        app_client, create_resp = factory.send.create(create_params)
        
        app_id = create_resp.app_id
        app_address = create_resp.app_address
        
        print("\n" + "="*40)
        print("SUCCESS: Contract Deployed!")
        print(f"APP_ID: {app_id}")
        print(f"Contract Address: {app_address}")
        print("="*40)
        print(f"-> ACTION: Update ALGORAND_APP_ID={app_id} in backend/.env")
        print("="*40)
        
    except Exception as e:
        print(f"\n[DEPLOY FAILED]: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    deploy()
