"""
Google Gemini provider adapter for the AI execution gateway.
Supports Gemini 2.0 Flash, 2.5 Flash, etc.
Uses creator's own API key (BYOK).
"""
import json
import google.generativeai as genai
from typing import AsyncIterator, Union
from .base_provider import BaseProvider

# Ordered list of fallback models to try if the primary model fails with quota/not-found errors
GEMINI_FALLBACK_CHAIN = [
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
]


class GeminiProvider(BaseProvider):
    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[Union[str, dict]]:
        api_key = self.api_key.strip().replace('"', '').replace("'", "")
        genai.configure(api_key=api_key)
        api_messages = self._build_messages(messages)

        # Convert messages to Gemini-compatible format
        full_prompt = "\n".join([
            f"{m['role']}: {m['content']}" for m in messages
        ])

        model_name = self.model
        total_content = ""
        success = False
        last_error = None

        # Try the primary model first
        try:
            gemini_model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=self.system_prompt
            )
            response = await gemini_model.generate_content_async(full_prompt, stream=True)
            async for chunk in response:
                if chunk.text:
                    total_content += chunk.text
                    yield chunk.text
            success = True
        except Exception as e:
            last_error = e
            err_str = str(e)
            is_retriable = (
                "429" in err_str or "quota" in err_str.lower() or
                "limit" in err_str.lower() or "404" in err_str or
                "not found" in err_str.lower() or "not supported" in err_str.lower()
            )
            if not is_retriable:
                raise e

        # If primary model failed with retriable error, try the fallback chain
        if not success:
            for fallback_model in GEMINI_FALLBACK_CHAIN:
                if fallback_model == model_name:
                    continue  # Skip the model that already failed
                try:
                    gemini_model = genai.GenerativeModel(
                        model_name=fallback_model,
                        system_instruction=self.system_prompt
                    )
                    response = await gemini_model.generate_content_async(full_prompt, stream=True)
                    total_content = ""  # Reset
                    async for chunk in response:
                        if chunk.text:
                            total_content += chunk.text
                            yield chunk.text
                    success = True
                    break  # Found a working fallback
                except Exception as fallback_err:
                    last_error = fallback_err
                    continue  # Try the next fallback

        if not success:
            raise RuntimeError(
                f"Primary model '{model_name}' failed. All fallback models also failed. "
                f"Last error: {last_error}"
            )

        # Yield usage info
        input_tokens = len(json.dumps(api_messages)) // 4
        yield {"input_tokens": input_tokens, "output_tokens": len(total_content) // 4}
