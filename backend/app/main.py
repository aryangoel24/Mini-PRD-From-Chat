import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import ChatRequest, ChatResponse
from .llm import call_llm
from .merge import merge_prd

load_dotenv()

app = FastAPI()

frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    llm_out = call_llm(req)
    merged = merge_prd(req.current_prd, llm_out.prd_patch)
    return llm_out
