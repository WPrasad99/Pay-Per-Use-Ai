"""
Pydantic v2 models representing the API Request/Response schema.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class ServiceOut(BaseModel):
    id: str
    name: str  
    description: str
    price_input_microalgo: int
    price_output_microalgo: int
    price_algo: Optional[float] = 0.0
    price_microalgo: Optional[int] = 0
    example_prompt: str
    provider: Optional[str] = None
    model: Optional[str] = None

class PaymentInfoOut(BaseModel):
    service_id: str
    app_id: int
    contract_address: str
    amount_microalgo: int
    amount_algo: float
    qr_code_base64: str
    instructions: List[str]

class InitiatePaymentIn(BaseModel):
    service_id: str
    wallet_address: str
    prompt: str
    
    @field_validator('wallet_address')
    @classmethod
    def validate_algorand_address(cls, v: str) -> str:
        """Validates standard 58 length base32 Algorand address format."""
        if len(v) != 58 or not v.replace('=', '').isalnum():
            raise ValueError("Invalid Algorand address format")
        return v

class InitiatePaymentOut(BaseModel):
    session_id: str
    expires_in_seconds: int
    message: str

class QueryIn(BaseModel):
    session_id: str
    tx_group_id: str

class QueryOut(BaseModel):
    status: str
    ai_response: str
    tx_verified: bool
    service_used: str
    tokens_used: int
  
class ErrorOut(BaseModel):
    error: str
    detail: str
