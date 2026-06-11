"""
Base provider interface for AI model providers.
All providers must implement stream_chat() for streaming responses.
"""
from abc import ABC, abstractmethod
from typing import AsyncIterator, Union


class BaseProvider(ABC):
    """Abstract base class for AI model providers."""

    def __init__(self, api_key: str, model: str, system_prompt: str,
                 temperature: float = 0.7, max_tokens: int = 1500):
        self.api_key = api_key
        self.model = model
        self.system_prompt = system_prompt
        self.temperature = temperature
        self.max_tokens = max_tokens

    @abstractmethod
    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[Union[str, dict]]:
        """
        Stream chat completion responses.
        
        Yields:
            str: text chunks
            dict: final usage info {"input_tokens": int, "output_tokens": int}
        """
        pass

    def _build_messages(self, messages: list[dict]) -> list[dict]:
        """Prepend system prompt to message list."""
        return [{"role": "system", "content": self.system_prompt}] + [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
