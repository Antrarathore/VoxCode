from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai_engine import OllamaEngine, OllamaEngineError
from executor import ExecutionResult, run_code
from prompts import build_explanation_prompt, build_generation_prompt, build_refinement_prompt

app = FastAPI(
    title="VoxCode AI Compiler API",
    version="1.0.0",
    description="Backend service for the VoxCode AI Compiler college project.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_engine = OllamaEngine()
SUPPORTED_LANGUAGES = {"Python", "C++", "Java"}
PYTHON_EXECUTION_LANGUAGE = "Python"


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1)


class RefineRequest(BaseModel):
    previous_code: str = Field(..., min_length=1)
    instruction: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1)


class ExplainRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1)


class RunRequest(BaseModel):
    code: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1)


class CodeResponse(BaseModel):
    code: str


class ExplainResponse(BaseModel):
    explanation: str


class RunResponse(BaseModel):
    status: str
    output: str
    error: str
    compiler_message: str
    execution_time: float


class HealthResponse(BaseModel):
    status: str
    ollama_available: bool
    model: str
    workspace: str


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "VoxCode AI Compiler backend is running.",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ready",
        ollama_available=ai_engine.is_available(),
        model=ai_engine.model,
        workspace=str(Path(__file__).resolve().parent),
    )


@app.post("/generate", response_model=CodeResponse)
def generate_code(payload: GenerateRequest) -> CodeResponse:
    language = validate_language(payload.language)
    prompt = build_generation_prompt(payload.text.strip(), language)

    try:
        code = ai_engine.generate(prompt)
    except OllamaEngineError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return CodeResponse(code=code)


@app.post("/refine", response_model=CodeResponse)
def refine_code(payload: RefineRequest) -> CodeResponse:
    language = validate_language(payload.language)
    prompt = build_refinement_prompt(
        previous_code=payload.previous_code,
        instruction=payload.instruction.strip(),
        language=language,
    )

    try:
        code = ai_engine.generate(prompt)
    except OllamaEngineError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return CodeResponse(code=code)


@app.post("/explain", response_model=ExplainResponse)
def explain_code(payload: ExplainRequest) -> ExplainResponse:
    language = validate_language(payload.language)
    prompt = build_explanation_prompt(payload.code, language)

    try:
        explanation = ai_engine.generate(prompt)
    except OllamaEngineError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return ExplainResponse(explanation=explanation)


@app.post("/run", response_model=RunResponse)
def run_compiler(payload: RunRequest) -> RunResponse:
    language = validate_language(payload.language)
    result = execute_code(payload.code, language)
    return RunResponse(**result.dict())


def validate_language(language: str) -> str:
    normalized = language.strip()
    if normalized not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{language}'. Choose from Python, C++, or Java.",
        )
    return normalized


def execute_code(code: str, language: str) -> ExecutionResult:
    try:
        return run_code(code=code, language=language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive API guard
        raise HTTPException(status_code=500, detail=f"Execution failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
