"""
Multi-turn chat endpoint with context preservation.
Balance checks and deductions are now on-chain via smart contract.
Protected by SIWA JWT authentication and rate limiting.
"""
import uuid
import hashlib
import json
import re
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, validator
from typing import Optional, List

from app.database import (
    create_conversation, get_conversation, mark_conversation_paid,
    add_message, get_conversation_messages, get_wallet_conversations,
    get_wallet_balance, log_transaction, log_ai_query, delete_conversation
)
from app.services.ai_service import SERVICE_CATALOG, get_ai_response_with_context
from app.core.security import get_current_user
from app.core.limiter import limiter

COST_PER_TOKEN = 0.00002

router = APIRouter(tags=["Chat"])

# Valid service_id pattern: alphanumeric + underscore/hyphen only (no injection possible)
_SERVICE_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_\-]{1,64}$')


class ChatIn(BaseModel):
    service_id: str
    wallet_address: str
    prompt: str
    conversation_id: Optional[str] = None
    tx_id: Optional[str] = None

    @validator('prompt')
    def validate_prompt(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Prompt cannot be empty")
        if len(v) > 4000:
            raise ValueError("Prompt must be 4000 characters or less")
        return v

    @validator('service_id')
    def validate_service_id(cls, v):
        if not _SERVICE_ID_PATTERN.match(v):
            raise ValueError("Invalid service_id format")
        return v


class MessageOut(BaseModel):
    role: str
    content: str
    tokens_used: int = 0
    cost_usd: float = 0.0
    model: Optional[str] = None
    created_at: str = ""


class ChatOut(BaseModel):
    conversation_id: str
    ai_response: str
    tokens_used: int
    cost_usd: float
    total_tokens_session: int
    total_cost_session: float
    messages: List[MessageOut]


class HistoryOut(BaseModel):
    conversation_id: str
    service_id: str
    total_tokens: int
    total_cost_usd: float
    created_at: str
    paid: int
    title: Optional[str] = None
    service_name: Optional[str] = None


@router.post("/chat", status_code=200)
@limiter.limit("10/minute")
async def chat(request: Request, data: ChatIn, wallet_address: str = Depends(get_current_user)):
    """
    Multi-turn conversational AI endpoint with Server-Sent Events (SSE).
    """
    if data.wallet_address != wallet_address:
        raise HTTPException(status_code=403, detail="Wallet mismatch: request wallet does not match authenticated session")
        
    from app.services.ai_service import SERVICE_CATALOG, stream_ai_response_with_context
    if data.service_id not in SERVICE_CATALOG:
        raise HTTPException(status_code=404, detail="Service not found")

    conversation_id = data.conversation_id

    # Create new conversation if none provided
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        await create_conversation(conversation_id, data.service_id, data.wallet_address)

        # Mark as paid if tx_id provided
        if data.tx_id:
            await mark_conversation_paid(conversation_id, data.tx_id)
    else:
        # Verify conversation exists
        conv = await get_conversation(conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if conv["wallet_address"] != data.wallet_address:
            raise HTTPException(status_code=403, detail="Wallet mismatch")

        # Mark paid if tx_id provided on existing conversation
        if data.tx_id and not conv["paid"]:
            await mark_conversation_paid(conversation_id, data.tx_id)

    # Save user message
    await add_message(conversation_id, "user", data.prompt.strip(), model=SERVICE_CATALOG[data.service_id]["name"])



    # Fetch full conversation history for context
    all_messages = await get_conversation_messages(conversation_id)
    context_messages = [{"role": m["role"], "content": m["content"]} for m in all_messages]

    async def generate():
        from app.services.algorand_service import precheck_session_balance, settle_service_cost
        from app.database import create_pending_settlement, update_pending_settlement
        
        service_config = SERVICE_CATALOG[data.service_id]
        estimated_cost = int((500 * service_config["price_input_microalgo"] / 1_000_000) + (500 * service_config["price_output_microalgo"] / 1_000_000))
        estimated_cost = max(estimated_cost, 50_000)
        
        # Precheck balance before starting heavy AI generation
        can_start, reason = await precheck_session_balance(data.wallet_address, estimated_cost)
        if not can_start:
            yield f"data: {json.dumps({'error': reason})}\n\n"
            return
            
        ai_text_chunks = []
        input_tokens = 0
        output_tokens = 0
        
        try:
            stream = stream_ai_response_with_context(data.service_id, context_messages)
            async for chunk in stream:
                if isinstance(chunk, dict):
                    if "input_tokens" in chunk:
                        input_tokens = chunk.get("input_tokens", 0)
                        output_tokens = chunk.get("output_tokens", 0)
                    elif "tokens_used" in chunk:
                        output_tokens = chunk["tokens_used"]
                else:
                    ai_text_chunks.append(chunk)
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                    
            ai_text = "".join(ai_text_chunks)
            tokens_used = input_tokens + output_tokens
            
            # Calculate dynamic cost based on exact tokens used
            cost_microalgo = int(
                (input_tokens * service_config["price_input_microalgo"] / 1_000_000) + 
                (output_tokens * service_config["price_output_microalgo"] / 1_000_000)
            )
            
            # Prevent 0 cost transactions from failing contract validation
            if cost_microalgo == 0:
                cost_microalgo = 100
                
            # Phase 1: Create pending settlement
            settlement_id = await create_pending_settlement(data.wallet_address, data.service_id, cost_microalgo)
                
            # Phase 2: On-chain Dynamic Settlement via Smart Contract
            success, reason = await settle_service_cost(data.wallet_address, data.service_id, cost_microalgo)
            
            if not success:
                # Log failed settlement for background retry worker
                await update_pending_settlement(settlement_id, 'failed', reason)
                import logging
                logging.error(f"Settlement failed for {data.wallet_address}, queued for retry. Reason: {reason}")
            else:
                await update_pending_settlement(settlement_id, 'completed')
            
            cost_algo = cost_microalgo / 1_000_000
            cost_usd = round(cost_algo * 0.20, 6) # Approximate USD visual display
            
            await log_transaction(
                wallet_address=data.wallet_address,
                tx_type="ai_usage",
                amount_microalgo=cost_microalgo,
                description=f"AI usage: {data.service_id} | In: {input_tokens} Out: {output_tokens} | {cost_algo:.6f} ALGO"
            )
            
            await add_message(conversation_id, "assistant", ai_text, tokens_used, cost_usd, model=SERVICE_CATALOG[data.service_id]["name"])
            
            prompt_hash = hashlib.sha256(data.prompt.encode()).hexdigest()
            response_hash = hashlib.sha256(ai_text.encode()).hexdigest()
            
            from app.services.algorand_service import send_on_chain_proof
            import asyncio
            asyncio.create_task(send_on_chain_proof(data.wallet_address, ai_text))
            
            await log_ai_query(
                wallet_address=data.wallet_address,
                service_id=data.service_id,
                prompt_hash=prompt_hash,
                response_hash=response_hash,
                tokens_used=tokens_used,
                conversation_id=conversation_id,
            )
            
            conv = await get_conversation(conversation_id)
            updated_messages = await get_conversation_messages(conversation_id)
            
            final_data = {
                "done": True,
                "conversation_id": conversation_id,
                "tokens_used": tokens_used,
                "cost_usd": cost_usd,
                "total_tokens_session": conv["total_tokens"],
                "total_cost_session": conv["total_cost_usd"],
                "messages": [
                    {
                        "role": m["role"],
                        "content": m["content"],
                        "tokens_used": m["tokens_used"],
                        "cost_usd": m["cost_usd"],
                        "model": m.get("model"),
                        "created_at": str(m["created_at"])
                    }
                    for m in updated_messages
                ]
            }
            yield f"data: {json.dumps(final_data)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/conversations/{wallet_address}")
async def get_history(wallet_address: str, service_id: Optional[str] = None):
    """
    Fetch conversation history for a wallet.
    """
    convs = await get_wallet_conversations(wallet_address, service_id)
    return [
        HistoryOut(
            conversation_id=c["conversation_id"],
            service_id=c["service_id"],
            total_tokens=c["total_tokens"],
            total_cost_usd=c["total_cost_usd"],
            created_at=str(c["created_at"]),
            paid=c["paid"],
            title=c.get("first_prompt"),
            service_name=c.get("service_name")
        )
        for c in convs
    ]


@router.get("/conversations/{wallet_address}/{conversation_id}/messages")
async def get_conv_messages(wallet_address: str, conversation_id: str):
    """
    Fetch all messages for a specific conversation.
    """
    conv = await get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv["wallet_address"] != wallet_address:
        raise HTTPException(status_code=403, detail="Wallet mismatch")

    messages = await get_conversation_messages(conversation_id)
    return {
        "conversation_id": conversation_id,
        "service_id": conv["service_id"],
        "total_tokens": conv["total_tokens"],
        "total_cost_usd": conv["total_cost_usd"],
        "messages": [
            MessageOut(
                role=m["role"],
                content=m["content"],
                tokens_used=m["tokens_used"],
                cost_usd=m["cost_usd"],
                model=m.get("model"),
                created_at=str(m["created_at"])
            )
            for m in messages
        ]
    }

@router.delete("/conversations/{conversation_id}")
async def delete_conv(conversation_id: str):
    await delete_conversation(conversation_id)
    return {"message": "Conversation deleted"}

@router.get("/users/{wallet_address}/analytics")
async def get_user_analytics_route(wallet_address: str):
    from app.database import get_user_analytics
    stats = await get_user_analytics(wallet_address)
    return stats

@router.get("/shared/{conversation_id}")
async def get_shared_conv(conversation_id: str):
    """Fetch a conversation for public sharing."""
    from app.database import get_conversation, get_conversation_messages
    conv = await get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = await get_conversation_messages(conversation_id)
    return {
        "conversation_id": conversation_id,
        "service_id": conv["service_id"],
        "messages": [
            {
                "role": m["role"],
                "content": m["content"],
                "created_at": str(m["created_at"])
            }
            for m in messages
        ]
    }
