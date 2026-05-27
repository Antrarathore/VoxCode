from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from pydantic import BaseModel

PYTHON_TIMEOUT_SECONDS = 5
SUPPORTED_EXECUTION_LANGUAGE = "Python"
DISPLAY_FILE_NAME = "user_code.py"
RUNTIME_DIR = Path(__file__).resolve().parent / ".runtime"


class ExecutionResult(BaseModel):
    status: str
    output: str
    error: str
    compiler_message: str
    execution_time: float


def run_code(code: str, language: str) -> ExecutionResult:
    language_name = language.strip()

    if language_name != SUPPORTED_EXECUTION_LANGUAGE:
        return ExecutionResult(
            status="warning",
            output="",
            error="",
            compiler_message=(
                f"Execution support for {language_name} is coming soon. AI code generation is available, but runtime execution currently works only for Python."
            ),
            execution_time=0.0,
        )

    return _run_python_code(code)


def _run_python_code(code: str) -> ExecutionResult:
    start_time = time.perf_counter()
    temp_path: Path | None = None

    try:
        RUNTIME_DIR.mkdir(exist_ok=True)

        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            prefix="voxcode_",
            dir=RUNTIME_DIR,
            delete=False,
            encoding="utf-8",
        ) as temp_file:
            temp_file.write(code)
            temp_path = Path(temp_file.name)

        process = subprocess.run(
            [sys.executable, str(temp_path)],
            capture_output=True,
            text=True,
            timeout=PYTHON_TIMEOUT_SECONDS,
            cwd=RUNTIME_DIR,
        )
        execution_time = time.perf_counter() - start_time

        stdout = _normalize_stream(process.stdout)
        stderr = _sanitize_error(process.stderr, temp_path)

        if process.returncode == 0:
            return ExecutionResult(
                status="success",
                output=stdout or "Program finished successfully with no console output.",
                error="",
                compiler_message="Compilation Status: Execution Successful",
                execution_time=round(execution_time, 3),
            )

        failure_label = "Compilation Failed" if "SyntaxError" in stderr else "Runtime Error"
        return ExecutionResult(
            status="error",
            output=stdout,
            error=stderr or "Unknown execution error.",
            compiler_message=f"Compilation Status: {failure_label}",
            execution_time=round(execution_time, 3),
        )

    except subprocess.TimeoutExpired:
        execution_time = time.perf_counter() - start_time
        return ExecutionResult(
            status="error",
            output="",
            error=f"Execution timed out after {PYTHON_TIMEOUT_SECONDS} seconds.",
            compiler_message="Compilation Status: Timeout Reached",
            execution_time=round(execution_time, 3),
        )
    finally:
        if temp_path and temp_path.exists():
            try:
                os.remove(temp_path)
            except OSError:
                pass


def _normalize_stream(stream: str) -> str:
    return stream.rstrip()


def _sanitize_error(error_text: str, temp_path: Path) -> str:
    cleaned = error_text.replace(str(temp_path), DISPLAY_FILE_NAME)
    cleaned = cleaned.replace(temp_path.name, DISPLAY_FILE_NAME)
    return cleaned.rstrip()
