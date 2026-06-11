"""
Decentralized Identity (DID) Service for PayPerAI Marketplace.

Format: did:payperai:<wallet_address>

DIDs are auto-generated when a creator registers and are used for:
- Creator ownership verification
- Agent provenance tracking
- On-chain identity linking
"""
import hashlib


def generate_did(wallet_address: str) -> str:
    """Generate a DID from an Algorand wallet address."""
    return f"did:payperai:{wallet_address}"


def verify_did_ownership(did: str, wallet_address: str) -> bool:
    """Verify that a DID belongs to the given wallet address."""
    expected = generate_did(wallet_address)
    return did == expected


def parse_did(did: str) -> dict:
    """Parse a PayPerAI DID into its components."""
    parts = did.split(":")
    if len(parts) != 3 or parts[0] != "did" or parts[1] != "payperai":
        return {"valid": False, "wallet_address": None}
    return {"valid": True, "wallet_address": parts[2]}


def create_did_document(wallet_address: str, display_name: str = "",
                        bio: str = "") -> dict:
    """
    Create a W3C-style DID Document for a creator.
    This is a simplified version for off-chain use.
    """
    did = generate_did(wallet_address)
    return {
        "@context": "https://www.w3.org/ns/did/v1",
        "id": did,
        "controller": did,
        "verificationMethod": [{
            "id": f"{did}#algorand-key",
            "type": "Ed25519VerificationKey2020",
            "controller": did,
            "blockchainAccountId": f"algorand:testnet:{wallet_address}"
        }],
        "service": [{
            "id": f"{did}#marketplace",
            "type": "AIAgentMarketplace",
            "serviceEndpoint": "https://payperai.vercel.app"
        }],
        "metadata": {
            "display_name": display_name,
            "bio": bio,
        }
    }


def hash_content(content: str) -> str:
    """Create a SHA-256 hash of content for proof-of-intelligence."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()
