import os
from algosdk import mnemonic, account, transaction
from algosdk.v2client.algod import AlgodClient
from dotenv import load_dotenv

def fund():
    load_dotenv()
    platform_mnemonic = os.getenv("PLATFORM_WALLET_MNEMONIC")
    contract_address = "7ECESHFJSUDPACRP4EA3CMPS2SYDAX3ASVCM5FG3VXH7ANL2DOFYZI44WI"
    
    algod_url = os.getenv("ALGOD_URL", "https://testnet-api.algonode.cloud")
    algod_token = os.getenv("ALGOD_TOKEN", "")
    
    client = AlgodClient(algod_token, algod_url)
    
    private_key = mnemonic.to_private_key(platform_mnemonic)
    sender = account.address_from_private_key(private_key)
    
    print(f"Sending 5 ALGO from {sender} to contract {contract_address}...")
    
    params = client.suggested_params()
    txn = transaction.PaymentTxn(sender, params, contract_address, 5_000_000)
    signed_txn = txn.sign(private_key)
    
    tx_id = client.send_transaction(signed_txn)
    print(f"Transaction sent: {tx_id}")
    
    # Wait for confirmation
    transaction.wait_for_confirmation(client, tx_id, 4)
    print("Contract funded!")

if __name__ == "__main__":
    fund()
