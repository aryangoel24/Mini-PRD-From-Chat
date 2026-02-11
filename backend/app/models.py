from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class PRD(BaseModel):
    title: Optional[str] = None
    problem: Optional[str] = None
    proposed_solution: Optional[str] = None
    requirements: List[str] = Field(default_factory=list)
    success_metrics: List[str] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)
    status: Literal["draft", "ready_for_review"] = "draft"


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    chat_history: List[ChatMessage] = Field(default_factory=list)
    current_prd: PRD = Field(default_factory=PRD)


class PRDPatch(PRD):
    # same fields, all optional already, arrays default to empty
    # patch semantics will be: overwrite scalars if present, append unique for arrays if non-empty
    pass


class ChatResponse(BaseModel):
    assistant_message: str
    clarifying_questions: List[str] = Field(default_factory=list)
    prd_patch: PRDPatch = Field(default_factory=PRDPatch)