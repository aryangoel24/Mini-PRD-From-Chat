import os
import json
from openai import OpenAI
from .models import ChatRequest, ChatResponse, PRDPatch

# client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
# MODEL = os.environ.get("OPENAI_MODEL", "gpt-5")

_client = None

def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Put it in backend/.env or export it in your shell."
            )
        _client = OpenAI(api_key=api_key)
    return _client

def get_model() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-5")

SYSTEM_INSTRUCTIONS = """
You are a product assistant that drafts a focused, iterative mini PRD from a chat conversation.

You must return JSON only, matching the following schema:

{
  "assistant_message": string,
  "prd_patch": {
     "title"?: string,
     "problem"?: string,
     "proposed_solution"?: string,
     "requirements"?: string[],
     "success_metrics"?: string[],
     "open_questions"?: string[],
     "status"?: "draft" | "ready_for_review"
  }
}

Rules:
- Be conversational. If key details are missing, ask 1–3 direct questions in assistant_message.
- Do not say you need more details without asking the questions.
- Do not assume unspecified details. Prefer asking instead of inventing.
- First turn: only set title and problem, and at most 1–2 high-level requirements.
- prd_patch should include only new or updated information.
- Avoid duplicating requirements. If refining an existing requirement, update it conceptually rather than adding a new overlapping one.
- Keep outputs concise: max 6 requirements per turn, max 5 success_metrics, max 3 open_questions.
- Output must be valid JSON only. No markdown. No extra text.
"""

def _build_input(req: ChatRequest) -> str:
    # Keep this simple: last few turns + current PRD + new message
    history = [{"role": m.role, "content": m.content} for m in req.chat_history[-8:]]
    payload = {
        "chat_history": history,
        "current_prd": req.current_prd.model_dump(),
        "latest_user_message": req.message,
    }
    return json.dumps(payload, ensure_ascii=False)


def call_llm(req: ChatRequest) -> ChatResponse:
    client = get_client()
    model = get_model()
    response = client.responses.create(
        model=model,
        instructions=SYSTEM_INSTRUCTIONS,
        input=_build_input(req),
        # If you later want, you can request strict JSON output config here,
        # but keeping it prompt-enforced is fine for a take-home.
    )

    text = response.output_text
    data = json.loads(text)

    # Pydantic validation: if it fails, you can retry once with a "fix JSON" prompt
    parsed = ChatResponse(
        assistant_message=data.get("assistant_message", ""),
        prd_patch=PRDPatch(**(data.get("prd_patch") or {})),
    )
    print(parsed)
    return parsed
