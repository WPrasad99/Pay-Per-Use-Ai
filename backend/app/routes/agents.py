"""
AI Agent API Routes — Agent CRUD, marketplace browsing, agent chat, reviews.

Endpoints:
- POST   /api/v1/agents                    — Create/publish agent
- GET    /api/v1/agents/{id}               — Get agent details
- PUT    /api/v1/agents/{id}               — Update agent
- DELETE /api/v1/agents/{id}               — Deactivate agent
- POST   /api/v1/agents/{id}/chat          — Chat with agent (SSE stream)
- GET    /api/v1/agents/{id}/reviews       — Get reviews
- POST   /api/v1/agents/{id}/reviews       — Submit review
- GET    /api/v1/agents/marketplace/browse  — Browse marketplace
- GET    /api/v1/agents/marketplace/trending — Trending agents
- GET    /api/v1/agents/marketplace/categories — Categories list
"""
import uuid
import json
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from app import database as db
from app.services.gateway import execute_agent_chat

router = APIRouter(tags=["Agents"])

# Available categories
CATEGORIES = [
    "coding", "business", "marketing", "legal",
    "education", "productivity", "content_creation",
    "data_analysis", "creative", "general"
]


# ── Request Models ────────────────────────────────────

class CreateAgentIn(BaseModel):
    creator_wallet: str
    name: str
    description: str
    category: Optional[str] = "general"
    tags: Optional[str] = ""
    thumbnail_url: Optional[str] = ""
    provider: str
    model: str
    system_prompt: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1500
    pricing_model: Optional[str] = "per_token"
    price_per_request_microalgo: Optional[int] = 0
    price_input_microalgo: Optional[int] = 0
    price_output_microalgo: Optional[int] = 0
    visibility: Optional[str] = "public"


class UpdateAgentIn(BaseModel):
    creator_wallet: str
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    pricing_model: Optional[str] = None
    price_per_request_microalgo: Optional[int] = None
    price_input_microalgo: Optional[int] = None
    price_output_microalgo: Optional[int] = None
    visibility: Optional[str] = None


class AgentChatIn(BaseModel):
    wallet_address: str
    prompt: str
    conversation_id: Optional[str] = None


class SubmitReviewIn(BaseModel):
    wallet_address: str
    rating: int
    review_text: Optional[str] = ""


# ── Agent CRUD ────────────────────────────────────────

@router.post("")
async def create_agent(data: CreateAgentIn):
    """Create and publish a new AI agent to the marketplace."""
    # Validate creator exists
    profile = await db.get_creator_profile(data.creator_wallet)
    if not profile:
        raise HTTPException(status_code=404, detail="Create a creator profile first")

    # Validate category
    if data.category and data.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Options: {', '.join(CATEGORIES)}")

    # Validate provider has API key
    valid_providers = {"openai", "groq", "gemini", "huggingface"}
    if data.provider not in valid_providers:
        raise HTTPException(status_code=400, detail=f"Invalid provider. Options: {', '.join(valid_providers)}")

    api_key = await db.get_creator_api_key(data.creator_wallet, data.provider)
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"You must add a {data.provider} API key before creating an agent with this provider"
        )

    # Validate fields
    if not data.name or len(data.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Agent name must be at least 2 characters")
    if not data.system_prompt or len(data.system_prompt.strip()) < 10:
        raise HTTPException(status_code=400, detail="System prompt must be at least 10 characters")

    agent_id = f"agent_{uuid.uuid4().hex[:12]}"

    await db.create_ai_agent(
        agent_id=agent_id,
        creator_wallet=data.creator_wallet,
        name=data.name.strip(),
        description=data.description.strip(),
        category=data.category or "general",
        tags=data.tags or "",
        thumbnail_url=data.thumbnail_url or "",
        provider=data.provider,
        model=data.model,
        system_prompt=data.system_prompt,
        temperature=data.temperature or 0.7,
        max_tokens=data.max_tokens or 1500,
        price_per_request_microalgo=data.price_per_request_microalgo or 0,
        price_input_microalgo=data.price_input_microalgo or 0,
        price_output_microalgo=data.price_output_microalgo or 0,
        pricing_model=data.pricing_model or "per_token",
        visibility=data.visibility or "public",
    )

    # On-chain registration (only if price > 0)
    contract_price = data.price_per_request_microalgo if data.pricing_model == 'per_request' else data.price_input_microalgo
    if contract_price > 0:
        from app.services.algorand_service import register_agent_on_chain
        await register_agent_on_chain(agent_id, contract_price, data.creator_wallet)

    return {"status": "success", "agent_id": agent_id}


@router.get("/marketplace/browse")
async def browse_marketplace(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Browse marketplace agents with optional filtering and sorting."""
    agents = await db.list_marketplace_agents(
        category=category, search=search, sort_by=sort_by,
        limit=limit, offset=offset
    )
    # Enrich with creator info
    enriched = []
    for a in agents:
        creator = await db.get_creator_profile(a['creator_wallet'])
        a['creator_name'] = creator['display_name'] if creator else 'Unknown'
        a['creator_did'] = creator['did'] if creator else ''
        enriched.append(a)
    return {"agents": enriched}


@router.get("/marketplace/trending")
async def get_trending():
    """Get trending agents."""
    agents = await db.get_trending_agents(limit=12)
    enriched = []
    for a in agents:
        creator = await db.get_creator_profile(a['creator_wallet'])
        a['creator_name'] = creator['display_name'] if creator else 'Unknown'
        a['creator_did'] = creator['did'] if creator else ''
        enriched.append(a)
    return {"agents": enriched}


@router.get("/marketplace/categories")
async def get_categories():
    """Get available agent categories."""
    return {"categories": CATEGORIES}


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """Get full agent details."""
    agent = await db.get_ai_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    creator = await db.get_creator_profile(agent['creator_wallet'])
    agent['creator_name'] = creator['display_name'] if creator else 'Unknown'
    agent['creator_did'] = creator['did'] if creator else ''

    # Don't expose system_prompt to non-creators
    usage_stats = await db.get_agent_usage_stats(agent_id)
    agent['usage_stats'] = usage_stats

    return agent


@router.put("/{agent_id}")
async def update_agent(agent_id: str, data: UpdateAgentIn):
    """Update agent config. Only the creator can update."""
    agent = await db.get_ai_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent['creator_wallet'] != data.creator_wallet:
        raise HTTPException(status_code=403, detail="Only the creator can update this agent")

    updates = {}
    for field in ['name', 'description', 'category', 'tags', 'system_prompt',
                  'temperature', 'max_tokens', 'pricing_model',
                  'price_per_request_microalgo', 'price_input_microalgo',
                  'price_output_microalgo', 'visibility']:
        val = getattr(data, field, None)
        if val is not None:
            updates[field] = val

    if updates:
        await db.update_ai_agent(agent_id, **updates)

    return {"status": "updated", "agent_id": agent_id}


@router.delete("/{agent_id}")
async def deactivate_agent(agent_id: str, wallet_address: str = Query(...)):
    """Deactivate an agent. Only the creator can deactivate."""
    agent = await db.get_ai_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent['creator_wallet'] != wallet_address:
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.deactivate_ai_agent(agent_id)

    # On-chain deactivation
    from app.services.algorand_service import deactivate_agent_on_chain
    await deactivate_agent_on_chain(agent_id)

    return {"status": "deactivated", "agent_id": agent_id}


# ── Agent Chat (SSE Stream) ──────────────────────────

@router.post("/{agent_id}/chat")
async def chat_with_agent(agent_id: str, data: AgentChatIn):
    """
    Chat with a marketplace AI agent via SSE streaming.
    Uses the creator's encrypted API key through the execution gateway.
    """
    agent = await db.get_ai_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if not agent['is_active']:
        raise HTTPException(status_code=400, detail="Agent is no longer active")

    # Build conversation messages
    messages = []
    if data.conversation_id:
        existing = await db.get_conversation_messages(data.conversation_id)
        for m in existing:
            messages.append({"role": m['role'], "content": m['content']})

    messages.append({"role": "user", "content": data.prompt})

    # Create/reuse conversation
    conv_id = data.conversation_id
    if not conv_id:
        conv_id = f"mc_{uuid.uuid4().hex[:16]}"
        await db.create_conversation(conv_id, agent_id, data.wallet_address)

    # Save user message
    await db.add_message(conv_id, "user", data.prompt, model=agent['name'])

    async def event_stream():
        full_response = ""
        usage_data = None

        try:
            async for chunk in execute_agent_chat(agent_id, data.wallet_address, messages):
                if isinstance(chunk, dict):
                    usage_data = chunk
                    yield f"data: {json.dumps({'type': 'usage', **chunk})}\n\n"
                else:
                    full_response += chunk
                    yield f"data: {json.dumps({'type': 'text', 'content': chunk})}\n\n"

            # Save assistant message
            tokens = 0
            cost = 0.0
            if usage_data:
                tokens = usage_data.get('input_tokens', 0) + usage_data.get('output_tokens', 0)
                cost = usage_data.get('cost_microalgo', 0) / 1_000_000

            await db.add_message(conv_id, "assistant", full_response, tokens, cost, model=agent['name'])

            # Send done event
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Reviews ───────────────────────────────────────────

@router.get("/{agent_id}/reviews")
async def get_reviews(agent_id: str):
    """Get reviews for an agent."""
    reviews = await db.get_agent_reviews(agent_id)
    return {"reviews": reviews}


@router.post("/{agent_id}/reviews")
async def submit_review(agent_id: str, data: SubmitReviewIn):
    """Submit a review for an agent."""
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    agent = await db.get_ai_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await db.create_review(agent_id, data.wallet_address, data.rating, data.review_text or "")
    return {"status": "success"}
