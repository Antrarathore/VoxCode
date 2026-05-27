from __future__ import annotations

import json
from dataclasses import dataclass

import requests


class OllamaEngineError(Exception):
    """Raised when Ollama cannot complete the requested operation."""


@dataclass
class OllamaEngine:
    base_url: str = "http://localhost:11434/api/generate"
    model: str = "deepseek-coder"
    timeout: int = 60

    def is_available(self) -> bool:
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            response.raise_for_status()
            return True
        except requests.RequestException:
            return False

    def generate(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9,
                "num_predict": 1200,
            },
        }

        try:
            response = requests.post(self.base_url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
        except requests.ConnectionError as exc:
            raise OllamaEngineError(
                "Ollama is not reachable at http://localhost:11434. Start Ollama and load the deepseek-coder model."
            ) from exc
        except requests.Timeout as exc:
            raise OllamaEngineError("Ollama response timed out. Try again with a shorter prompt.") from exc
        except requests.HTTPError as exc:
            message = exc.response.text if exc.response is not None else str(exc)
            raise OllamaEngineError(f"Ollama request failed: {message}") from exc
        except json.JSONDecodeError as exc:
            raise OllamaEngineError("Ollama returned an invalid JSON response.") from exc

        raw_text = (data.get("response") or "").strip()
        if not raw_text:
            raise OllamaEngineError("Ollama returned an empty response.")

        return self._clean_response(raw_text)

    def _clean_response(self, text: str) -> str:
        cleaned = text.replace("```python", "```").replace("```cpp", "```").replace("```java", "```")
        if "```" not in cleaned:
            return cleaned.strip()

        segments = cleaned.split("```")
        if len(segments) >= 3:
            return segments[1].strip()
        return cleaned.replace("```", "").strip()
