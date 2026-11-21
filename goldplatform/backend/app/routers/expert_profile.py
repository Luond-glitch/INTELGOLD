from typing import Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from ..db import get_db
from ..deps import require_roles
from ..models import ExpertExtra, ExpertService, Role, User

router = APIRouter(prefix="/api/expert", tags=["expert"])
SERVICES = ["Environmental Impact Assessment", "Environmental audits", "Environmental management plans", "Environmental compliance assessments",
            "Environmental monitoring", "Mine rehabilitation planning", "Waste management consultancy", "Water quality assessment",
            "Environmental training", "Community environmental education"]


class ProfileIn(BaseModel):
    firm_name: str | None = Field(None, max_length=160)
    location: str = Field(min_length=2, max_length=160)
    county: str = Field(min_length=2, max_length=60)
    qualifications: str | None = Field(None, max_length=600)
    expertise: str | None = Field(None, max_length=600)
    years_experience: int | None = Field(None, ge=0, le=60)
    bio: str | None = Field(None, max_length=1200)
    availability: Literal["available", "busy", "away"] = "available"
    services: list[str] = Field(default_factory=list, max_length=10)


def view(u: User, db: Session):
    e, x = u.expert, db.get(ExpertExtra, u.id)
    return {"name": u.full_name, "email": u.email, "licence": e.eia_licence_no, "verification": e.verification.value,
            "firm_name": e.firm_name, "location": e.location, "county": e.county, "qualifications": e.qualifications,
            "expertise": e.expertise, "years_experience": e.years_experience, "bio": x.bio if x else None,
            "availability": x.availability if x else "available", "all_services": SERVICES,
            "services": db.scalars(select(ExpertService.name).where(ExpertService.user_id == u.id)).all()}


@router.get("/me")
def me(u: User = Depends(require_roles(Role.expert)), db: Session = Depends(get_db)):
    return view(u, db)


@router.put("/me")   # the EIA licence number and name are not editable here: they were verified by an administrator
def update(body: ProfileIn, u: User = Depends(require_roles(Role.expert)), db: Session = Depends(get_db)):
    e = u.expert
    e.firm_name, e.location, e.county = body.firm_name, body.location.strip(), body.county.strip()
    e.qualifications, e.expertise, e.years_experience = body.qualifications, body.expertise, body.years_experience
    x = db.get(ExpertExtra, u.id) or ExpertExtra(user_id=u.id)
    x.bio, x.availability = body.bio, body.availability; db.add(x)
    db.execute(delete(ExpertService).where(ExpertService.user_id == u.id))
    for s in dict.fromkeys(body.services):
        if s in SERVICES: db.add(ExpertService(user_id=u.id, name=s))
    db.commit(); return view(u, db)
