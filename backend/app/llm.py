import os
import json
from openai import OpenAI
from .models import ChatRequest, ChatResponse, PRDPatch

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

Return JSON only, matching this schema:

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

Core rules:
- Be conversational in assistant_message. If key details are missing, ask 1–3 direct questions in assistant_message.
- Questions must be explicit questions ending with "?".
- Do not assume unspecified details. Ask instead.
- Do not contradict user-provided decisions already present in current_prd or chat history.

SECTION REWRITE CONTRACT (IMPORTANT):
- Treat each list field as a section that can be rewritten.
- If you include "requirements" in prd_patch, it must be the COMPLETE rewritten Requirements section
  given: (a) current_prd.requirements, and (b) the latest user message.
- The rewritten list must be a clean, deduplicated set of requirements representing the current truth.
- Remove or replace any earlier vague requirements that are superseded by newer specifics.
- Do NOT keep both a general placeholder and its specific version. Keep only the most specific version.
- Do not output incremental additions for requirements.
- Prefer rewrite-in-place: update existing requirement lines with newer specifics instead of adding extra lines.
- Keep the requirements list as compact as possible; avoid net-new items unless the user introduces truly new scope.
- If new details can fit inside an existing requirement, rewrite that requirement and do not add another requirement.

- If you include "success_metrics" in prd_patch, it must be the COMPLETE rewritten Success Metrics section,
  deduplicated and consistent with the latest info.
- If you include "open_questions" in prd_patch, it may be incremental, but it must be deduplicated and must not include already-answered questions.

Formatting rules for list items:
- requirements: max 6 items, each is a single atomic sentence starting with a verb.
- success_metrics: max 5 items, each is a single measurable metric.
- open_questions: max 3 items, each is a single unresolved question.
- No duplicates or near-duplicates within any list.

Inclusion rule:
- Only include "requirements" in prd_patch when new information changes requirements.
- Only include "success_metrics" in prd_patch when new information changes success metrics.
- When requirements change due to clarifications, prefer keeping the same count or fewer items.
- Increase requirement count only if the latest user message introduces a genuinely new capability.

First-turn constraint:
- On the first user message, only set title, problem and proposed solution, and at most 1–2 high-level requirements.
- Ask clarifying questions instead of inventing detailed scope.

Self-check before returning:
- Check requirements/success_metrics/open_questions for redundancy.
- If two items overlap, merge them into one.

Output constraints:
- Output must be valid JSON only. No markdown. No extra text.
"""

def _build_input(req: ChatRequest) -> str:
    # Keep this simple: last few turns + current PRD + new message
    history = [{"role": m.role, "content": m.content} for m in req.chat_history[-8:]]
    payload = {
        "latest_user_message": req.message,
        "chat_history": history,
        "current_prd": req.current_prd.model_dump(),
        "instructional_note": {
            "requirements_current": req.current_prd.requirements,
            "success_metrics_current": req.current_prd.success_metrics,
            "open_questions_current": req.current_prd.open_questions,
        },
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

    return parsed
