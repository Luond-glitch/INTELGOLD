from typing import Literal
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from .. import ai
from ..deps import current_user
from ..models import Role, User
from ..deps import require_roles
from .auth import limiter

router = APIRouter(prefix="/api/chat", tags=["chat"])


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Turn] = Field(default_factory=list, max_length=12)


@router.get("/health")   # admin only: pings each provider so key or model problems are visible
def health(_: User = Depends(require_roles(Role.admin))):
    return ai.health()


@router.post("")
@limiter.limit("20/minute")
def chat(request: Request, body: ChatIn, user: User = Depends(current_user)):
    aud = "researcher" if user.role == Role.researcher else "miner"   # decided server-side
    r = ai.ask([t.model_dump() for t in body.history], body.message.strip(), aud)
    return {**r, "notice": "AI-generated guidance. Not legal or engineering advice."}
