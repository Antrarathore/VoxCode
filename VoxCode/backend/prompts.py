from __future__ import annotations


def build_generation_prompt(instruction: str, language: str) -> str:
    return f"""
You are an expert {language} developer working inside an AI-assisted compiler system.
The user's request may come from voice transcription, so small grammar mistakes, missing punctuation, or speech-to-text wording issues may appear.
Infer the intended programming task carefully and generate clean, correct, optimized, beginner-friendly {language} code.
Return only code.
Do not include markdown.
Do not include explanation unless asked.
Keep the response complete and runnable.
Prefer readable variable names and simple structure suitable for a college demo.
Use proper indentation consistently.
If comments are helpful, keep them short, clear, and minimal.
Do not write large descriptive comments because detailed explanation belongs in the separate code explanation panel.

User Instruction:
{instruction}
""".strip()


def build_refinement_prompt(previous_code: str, instruction: str, language: str) -> str:
    return f"""
You are an expert {language} developer improving code inside an AI compiler workspace.
The refinement request may come from voice transcription, so interpret the user's intent carefully.
Modify the code according to the user's instruction.
Keep the code complete and runnable.
Return full updated code only.
Do not explain.
Do not include markdown.
Preserve proper indentation and formatting.
If comments are added, keep them short, clear, and minimal.
Avoid long descriptive comments because detailed explanation belongs in the separate code explanation panel.

Previous Code:
{previous_code}

User Instruction:
{instruction}
""".strip()


def build_explanation_prompt(code: str, language: str) -> str:
    return f"""
Explain the following {language} code in simple beginner-friendly language.
Explain step by step in short points.
Mention what the input, processing, and output parts do.
Keep the explanation clear for a compiler design project demonstration.

Code:
{code}
""".strip()
