"""Creates DEMO accounts. Run once:  python -m app.seed   (change or delete these before going live)"""
from sqlalchemy import select, func
from .db import Base, SessionLocal, engine
from .models import ExpertProfile, Role, User
from .security import hash_password

Base.metadata.create_all(engine)
ACCOUNTS = [
    dict(role=Role.admin, full_name="Super Administrator", email="admin@goldplatform.demo", pw="Admin@Demo2026"),
    dict(role=Role.expert, full_name="Demo Environmental Officer", email="demo.expert@goldplatform.demo", pw="Expert@Demo2026",
         phone="+254700000000"),
]
with SessionLocal() as db:
    for a in ACCOUNTS:
        if db.scalar(select(User.id).where(func.lower(User.email) == a["email"])): print("exists:", a["email"]); continue
        u = User(role=a["role"], full_name=a["full_name"], email=a["email"], phone=a.get("phone"), email_verified=True,
                 password_hash=hash_password(a["pw"]))
        if a["role"] == Role.expert:
            u.expert = ExpertProfile(firm_name="Demo Environmental Consultants", location="Bondo Town", county="Siaya",
                                     eia_licence_no="DEMO/EIA/001", qualifications="BSc Environmental Science",
                                     expertise="EIA, rehabilitation planning, waste management", years_experience=8)
        db.add(u); db.commit(); print("created:", a["email"], "/", a["pw"])
