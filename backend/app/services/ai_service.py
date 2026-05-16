"""
OpenAI wrapper and service catalog provider.
"""
import openai
from openai import AsyncOpenAI
from app.config import settings

SERVICE_CATALOG = {
    "llama3": {
        "id": "llama3",
        "name": "Llama 3.3 (Groq)",
        "description": "Lightning-fast general purpose reasoning model powered by Groq.",
        "price_input_microalgo": 950_000,
        "price_output_microalgo": 2_800_000,
        "example_prompt": "Explain the significance of the Turing Test.",
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    "gpt4o_mini": {
        "id": "gpt4o_mini",
        "name": "GPT-4o Mini (OpenAI)",
        "description": "Fast and intelligent multi-purpose assistant from OpenAI.",
        "price_input_microalgo": 1_300_000,
        "price_output_microalgo": 5_200_000,
        "example_prompt": "Write a Python script to scrape a website.",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    "gemini_flash": {
        "id": "gemini_flash",
        "name": "Gemini 1.5 Flash",
        "description": "Google's lightweight, fast, and highly capable multimodal model.",
        "price_input_microalgo": 350_000,
        "price_output_microalgo": 1_400_000,
        "example_prompt": "Draft a professional email to a client.",
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    "qwen25": {
        "id": "qwen25",
        "name": "Qwen 2.5 (HuggingFace)",
        "description": "Powerful open-weights model capable of deep technical insights.",
        "price_input_microalgo": 2_600_000,
        "price_output_microalgo": 5_500_000,
        "example_prompt": "Explain the concept of quantum entanglement simply.",
        "provider": "huggingface",
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    # Backward compatibility aliases for old service IDs
    "summarizer": {
        "id": "summarizer",
        "name": "Llama 3.3 (Groq)",
        "description": "Lightning-fast general purpose reasoning model powered by Groq.",
        "price_input_microalgo": 950_000,
        "price_output_microalgo": 2_800_000,
        "example_prompt": "Explain the significance of the Turing Test.",
        "provider": "groq",
        "model": "llama-3.3-70b-versatile",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    "saas_designer": {
        "id": "saas_designer",
        "name": "GPT-4o Mini (OpenAI)",
        "description": "Fast and intelligent multi-purpose assistant from OpenAI.",
        "price_input_microalgo": 1_300_000,
        "price_output_microalgo": 5_200_000,
        "example_prompt": "Write a Python script to scrape a website.",
        "provider": "openai",
        "model": "gpt-4o-mini",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    "impact_reviewer": {
        "id": "impact_reviewer",
        "name": "Gemini 1.5 Flash",
        "description": "Google's lightweight, fast, and highly capable multimodal model.",
        "price_input_microalgo": 350_000,
        "price_output_microalgo": 1_400_000,
        "example_prompt": "Draft a professional email to a client.",
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    },
    "qwen_chat": {
        "id": "qwen_chat",
        "name": "Qwen 2.5 (HuggingFace)",
        "description": "Powerful open-weights model capable of deep technical insights.",
        "price_input_microalgo": 2_600_000,
        "price_output_microalgo": 5_500_000,
        "example_prompt": "Explain the concept of quantum entanglement simply.",
        "provider": "huggingface",
        "model": "Qwen/Qwen2.5-72B-Instruct",
        "system_prompt": "You are a highly capable, general-purpose AI assistant. Provide helpful, clear, and accurate responses to user queries."
    }
}

def get_services_list() -> list[dict]:
    """
    Returns array containing all services available in the catalog.
    """
    return [{**s, "price_algo": 0.0, "price_microalgo": 0} for s in SERVICE_CATALOG.values()]

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
                yield {"input_tokens": chunk.usage.prompt_tokens, "output_tokens": chunk.usage.completion_tokens}

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
            if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                total_content += content
                yield content
        # Groq usage estimation (simplified)
        import json
        input_tokens = len(json.dumps(api_messages)) // 4
        yield {"input_tokens": input_tokens, "output_tokens": len(total_content) // 4}

    elif provider == "gemini":
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        # Use gemini-2.0-flash which is confirmed available for this key
        gemini_model = genai.GenerativeModel(model_name="gemini-2.0-flash", system_instruction=system_prompt)
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
        import json
        input_tokens = len(json.dumps(api_messages)) // 4
        yield {"input_tokens": input_tokens, "output_tokens": len(total_content) // 4}

    elif provider == "huggingface":
        from huggingface_hub import AsyncInferenceClient
        client = AsyncInferenceClient(token=settings.hf_api_key)
        total_content = ""
        stream = await client.chat_completion(
            model=model,
            messages=api_messages,
            max_tokens=1500,
            stream=True
        )
        async for chunk in stream:
            if hasattr(chunk, "choices") and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                total_content += content
                yield content
        import json
        input_tokens = len(json.dumps(api_messages)) // 4
        yield {"input_tokens": input_tokens, "output_tokens": len(total_content) // 4}
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
