"""
OpenAI provider adapter for the AI execution gateway.
Supports all OpenAI-compatible models (GPT-4o, GPT-4o-mini, etc.)
Uses creator's own API key (BYOK).
"""
from openai import AsyncOpenAI
from typing import AsyncIterator, Union
from .base_provider import BaseProvider


class OpenAIProvider(BaseProvider):
    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[Union[str, dict]]:
        client = AsyncOpenAI(api_key=self.api_key)
        api_messages = self._build_messages(messages)

        stream = await client.chat.completions.create(
            model=self.model,
            messages=api_messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True,
            stream_options={"include_usage": True}
        )

        async for chunk in stream:
            if len(chunk.choices) > 0 and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
            if getattr(chunk, "usage", None):
                yield {
                    "input_tokens": chunk.usage.prompt_tokens,
                    "output_tokens": chunk.usage.completion_tokens
                }
