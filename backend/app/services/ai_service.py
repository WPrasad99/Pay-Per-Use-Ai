"""
OpenAI wrapper and service catalog provider.
"""
import openai
from openai import AsyncOpenAI
from app.config import settings

SERVICE_CATALOG = {
    "summarizer": {
        "id": "summarizer",
        "name": "Quick Summarizer",
        "description": "Extract key trade-offs and bullet points instantly.",
        "price_algo": 0.1,
        "price_microalgo": 100_000,
        "example_prompt": "Summarize the main trade-offs in bullet points.",
        "provider": "groq",
        "model": "llama3-70b-8192",
        "system_prompt": "You are a concise analyst. Summarize complex topics into high-impact bullet points focusing on trade-offs."
    },
    "saas_designer": {
        "id": "saas_designer",
        "name": "SaaS Copywriter",
        "description": "Turn rough ideas into polished SaaS landing page sections.",
        "price_algo": 0.2,
        "price_microalgo": 200_000,
        "example_prompt": "Turn this into a polished SaaS landing page section.",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "system_prompt": "You are an elite SaaS copywriter. Create high-converting, polished landing page copy from user inputs."
    },
    "impact_reviewer": {
        "id": "impact_reviewer",
        "name": "Impact Reviewer",
        "description": "Get critical feedback and high-impact improvement suggestions.",
        "price_algo": 0.15,
        "price_microalgo": 150_000,
        "example_prompt": "Review this and suggest the highest-impact improvements.",
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "system_prompt": "You are a strategic advisor. Review user content and provide the 3 highest-impact improvements possible."
    },
    "qwen_chat": {
        "id": "qwen_chat",
        "name": "Qwen Expert",
        "description": "Harness the power of Qwen via HuggingFace for specialized reasoning.",
        "price_algo": 0.1,
        "price_microalgo": 100_000,
        "example_prompt": "Explain the concept of quantum entanglement simply.",
        "provider": "huggingface",
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "system_prompt": "You are the Qwen AI expert. Provide deep technical insights and clear explanations."
    }
}

def get_services_list() -> list[dict]:
    """
    Returns array containing all services available in the catalog.
    """
    return list(SERVICE_CATALOG.values())

async def get_ai_response(service_id: str, user_prompt: str) -> tuple[str, int]:
    """
    Proxies query to OpenAI with the mapped system prompt.
    Returns the message text and token consumption.
    """
    if service_id not in SERVICE_CATALOG:
        raise ValueError("Invalid service_id provided for AI inference.")
        
    system_prompt = SERVICE_CATALOG[service_id]["system_prompt"]
    
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=800,
            temperature=0.7
        )
        
        reply_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        return reply_text, tokens_used
        
    except openai.RateLimitError as e:
        raise RuntimeError("OpenAI rate limit exceeded. Please try again later.") from e
    except openai.APIError as e:
        raise RuntimeError(f"OpenAI API error occurred: {e}") from e
    except Exception as e:
        raise RuntimeError(f"Unexpected error interfacing with OpenAI: {e}") from e


async def get_ai_response_with_context(service_id: str, messages: list[dict]) -> tuple[str, int]:
    """
    Multi-turn conversation support.
    Takes a list of {role, content} messages and returns AI response with full context.
    """
    if service_id not in SERVICE_CATALOG:
        raise ValueError("Invalid service_id provided for AI inference.")
        
    system_prompt = SERVICE_CATALOG[service_id]["system_prompt"]
    
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    # Build full message array with system prompt + conversation history
    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        api_messages.append({"role": msg["role"], "content": msg["content"]})
    
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=api_messages,
            max_tokens=1500,
            temperature=0.7
        )
        
        reply_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        return reply_text, tokens_used
        
    except openai.RateLimitError as e:
        raise RuntimeError("OpenAI rate limit exceeded. Please try again later.") from e
    except openai.APIError as e:
        raise RuntimeError(f"OpenAI API error occurred: {e}") from e
    except Exception as e:
        raise RuntimeError(f"Unexpected error interfacing with OpenAI: {e}") from e

async def stream_ai_response_with_context(service_id: str, messages: list[dict]):
    if service_id not in SERVICE_CATALOG:
        raise ValueError("Invalid service_id")
        
    config = SERVICE_CATALOG[service_id]
    provider = config.get("provider", "openai")
    model = config.get("model", "gpt-4o-mini")
    system_prompt = config["system_prompt"]
    
    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        api_messages.append({"role": msg["role"], "content": msg["content"]})
    
    if provider == "openai":
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        stream = await client.chat.completions.create(
            model=model,
            messages=api_messages,
            max_tokens=1500,
            temperature=0.7,
            stream=True,
            stream_options={"include_usage": True}
        )
        async for chunk in stream:
            if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
            if getattr(chunk, "usage", None):
                yield {"tokens_used": chunk.usage.total_tokens}

    elif provider == "groq":
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)
        stream = await client.chat.completions.create(
            model=model,
            messages=api_messages,
            max_tokens=1500,
            temperature=0.7,
            stream=True
        )
        total_content = ""
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                total_content += content
                yield content
        # Groq usage estimation (simplified)
        yield {"tokens_used": len(total_content) // 4}

    elif provider == "gemini":
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        gemini_model = genai.GenerativeModel(model)
        # Convert messages to Gemini format
        chat_session = gemini_model.start_chat(history=[])
        # Send system prompt as first message or instruction
        full_prompt = f"System: {system_prompt}\n\n" + "\n".join([f"{m['role']}: {m['content']}" for m in messages])
        response = await gemini_model.generate_content_async(full_prompt, stream=True)
        total_content = ""
        async for chunk in response:
            if chunk.text:
                total_content += chunk.text
                yield chunk.text
        yield {"tokens_used": len(total_content) // 4}

    elif provider == "huggingface":
        from huggingface_hub import AsyncInferenceClient
        client = AsyncInferenceClient(token=settings.hf_api_key)
        total_content = ""
        async for chunk in client.chat_completion(
            model=model,
            messages=api_messages,
            max_tokens=1500,
            stream=True
        ):
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                total_content += content
                yield content
        yield {"tokens_used": len(total_content) // 4}
async def generate_ai_image(prompt: str) -> str:
    """
    Calls OpenAI DALL-E 3 to generate a high-quality image URL.
    """
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return response.data[0].url
    except Exception as e:
        raise RuntimeError(f"DALL-E 3 Image Generation failed: {str(e)}")
