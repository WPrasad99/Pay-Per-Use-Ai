"""
HuggingFace Inference API provider adapter for the AI execution gateway.
Supports any HuggingFace-hosted model via the Inference API.
Uses creator's own API key (BYOK).
"""
import json
from huggingface_hub import AsyncInferenceClient
from typing import AsyncIterator, Union
from .base_provider import BaseProvider


class HuggingFaceProvider(BaseProvider):
    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[Union[str, dict]]:
        client = AsyncInferenceClient(token=self.api_key)
        api_messages = self._build_messages(messages)

        total_content = ""
        stream = await client.chat_completion(
            model=self.model,
            messages=api_messages,
            max_tokens=self.max_tokens,
            stream=True
        )

        async for chunk in stream:
            if (hasattr(chunk, "choices") and len(chunk.choices) > 0
                    and chunk.choices[0].delta.content):
                content = chunk.choices[0].delta.content
                total_content += content
                yield content

        input_tokens = len(json.dumps(api_messages)) // 4
        yield {"input_tokens": input_tokens, "output_tokens": len(total_content) // 4}
