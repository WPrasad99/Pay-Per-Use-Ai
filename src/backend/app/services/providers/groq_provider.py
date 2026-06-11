"""
Groq provider adapter for the AI execution gateway.
Supports Llama, Mixtral, and other Groq-hosted models.
Uses creator's own API key (BYOK).
"""
import json
from groq import AsyncGroq
from typing import AsyncIterator, Union
from .base_provider import BaseProvider


class GroqProvider(BaseProvider):
    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[Union[str, dict]]:
        client = AsyncGroq(api_key=self.api_key)
        api_messages = self._build_messages(messages)

        stream = await client.chat.completions.create(
            model=self.model,
            messages=api_messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True
        )

        total_content = ""
        async for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                total_content += content
                yield content

        # Groq doesn't always return usage in stream, so estimate
        input_tokens = len(json.dumps(api_messages)) // 4
        yield {"input_tokens": input_tokens, "output_tokens": len(total_content) // 4}
