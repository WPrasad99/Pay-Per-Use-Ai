import os
import json
import traceback
from pathlib import Path
from algosdk.v2client.algod import AlgodClient
from algosdk.v2client.indexer import IndexerClient
from algokit_utils import get_account_from_mnemonic, ApplicationClient
from algokit_utils.application_specification import ApplicationSpecification
from app.config import settings

def deploy():
    print("Starting fresh deployment of PayPerAI contract...")
    
    mnemonic = settings.platform_wallet_mnemonic
    algod_url = settings.algod_url
    algod_token = settings.algod_token
    
    algod_client = AlgodClient(algod_token, algod_url)
    indexer_client = IndexerClient("", settings.indexer_url)
    deployer = get_account_from_mnemonic(mnemonic)
    
    artifact_path = Path("..") / "contract" / "smart_contracts" / "contract" / "artifacts" / "PayPerAI.arc56.json"
    
    if not artifact_path.exists():
        artifact_path = Path("..") / "contract" / "artifacts" / "PayPerAI.arc32.json"
        
    if not artifact_path.exists():
        print(f"Error: Contract artifact not found at {artifact_path}")
        return
        
    with open(artifact_path, "r") as f:
        app_spec_json = f.read()

    if artifact_path.suffix == ".json" and "arc56" in artifact_path.name:
        from algokit_utils import Arc56Contract
        app_spec = Arc56Contract.from_json(app_spec_json)
    else:
        app_spec = ApplicationSpecification.from_json(app_spec_json)

    app_client = ApplicationClient(
        algod_client=algod_client,
        indexer_client=indexer_client,
        app_spec=app_spec,
        signer=deployer,
        sender=deployer.address,
        creator=deployer.address,
        app_id=0
    )
    
    try:
        print("Creating new application on-chain...")
        response = app_client.create()
        print(f"Response type: {type(response)}")
        
        # Try to get app_id from different possible locations
        new_app_id = getattr(response, 'app_id', None)
        if new_app_id is None:
            # Check tx_info
            tx_info = getattr(response, 'tx_info', {})
            new_app_id = tx_info.get('application-index')
            
        if new_app_id is None:
            print("Could not find app_id in response. Response contents:")
            print(vars(response))
            return

        print(f"Success! New APP_ID: {new_app_id}")
        
        # Update .env file
        env_path = Path(".env")
        if env_path.exists():
            with open(env_path, "r") as f:
                lines = f.readlines()
            
            with open(env_path, "w") as f:
                found = False
                for line in lines:
                    if line.strip().startswith("ALGORAND_APP_ID="):
                        f.write(f"ALGORAND_APP_ID={new_app_id}\n")
                        found = True
                    else:
                        f.write(line)
                if not found:
                    f.write(f"\nALGORAND_APP_ID={new_app_id}\n")
            print(f"Updated {env_path} with new App ID.")
        
    except Exception as e:
        print(f"Deployment failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    deploy()
