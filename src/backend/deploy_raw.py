import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import ApplicationCreateTxn, StateSchema, OnComplete
from app.config import settings

def deploy():
    print("Starting raw deployment using TEAL files...")
    
    algod_client = algod.AlgodClient(settings.algod_token, settings.algod_url)
    private_key = mnemonic.to_private_key(settings.platform_wallet_mnemonic)
    sender = account.address_from_private_key(private_key)
    
    # Paths to TEAL
    approval_path = "../contract/smart_contracts/contract/artifacts/PayPerAI.approval.teal"
    clear_path = "../contract/smart_contracts/contract/artifacts/PayPerAI.clear.teal"
    
    with open(approval_path, "r") as f:
        approval_source = f.read()
    with open(clear_path, "r") as f:
        clear_source = f.read()
        
    # Compile
    print("Compiling approval program...")
    approval_res = algod_client.compile(approval_source)
    approval_binary = base64.b64decode(approval_res["result"])
    
    print("Compiling clear program...")
    clear_res = algod_client.compile(clear_source)
    clear_binary = base64.b64decode(clear_res["result"])
    
    # State schema (from contract.py)
    # Global: owner (address), service_count (uint64), platform_fee_pct (uint64), proof_count (uint64)
    # That's 1 byte, 3 ints. 
    global_schema = StateSchema(num_uints=3, num_byte_slices=1)
    local_schema = StateSchema(num_uints=0, num_byte_slices=0)
    
    params = algod_client.suggested_params()
    
    print(f"Approval program binary size: {len(approval_binary)} bytes")
    print(f"Clear program binary size: {len(clear_binary)} bytes")
    
    # Create txn
    # ARC4 create method selector: create()void -> 0x4c5c61ba
    create_selector = bytes.fromhex("4c5c61ba")
    
    txn = ApplicationCreateTxn(
        sender=sender,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_binary,
        clear_program=clear_binary,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=[create_selector],
        extra_pages=0 # Try 0 to save MBR
    )
    
    signed_txn = txn.sign(private_key)
    txid = algod_client.send_transaction(signed_txn)
    print(f"Sent creation transaction. TXID: {txid}")
    
    # Wait for confirmation
    wait_for_confirmation(algod_client, txid)
    
    # Get app id
    response = algod_client.pending_transaction_info(txid)
    new_app_id = response["application-index"]
    print(f"Success! New APP_ID: {new_app_id}")
    
    # Update .env
    update_env(new_app_id)

def update_env(new_app_id):
    from pathlib import Path
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

def wait_for_confirmation(client, txid):
    last_round = client.status().get('last-round')
    txinfo = client.pending_transaction_info(txid)
    while not (txinfo.get('confirmed-round') and txinfo.get('confirmed-round') > 0):
        print("Waiting for confirmation...")
        last_round += 1
        client.status_after_block(last_round)
        txinfo = client.pending_transaction_info(txid)
    print(f"Transaction confirmed in round {txinfo.get('confirmed-round')}.")

if __name__ == "__main__":
    deploy()
