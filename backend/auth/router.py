from fastapi import APIRouter, HTTPException, status
from database import get_connection
from auth.models import RegisterRequest, LoginRequest, TokenResponse
from auth import service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    with get_connection() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (body.email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        password_hash = service.hash_password(body.password)
        cursor = conn.execute(
            "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
            (body.email, body.name, password_hash),
        )
        user_id = cursor.lastrowid
        conn.commit()

    token = service.create_jwt(user_id, body.email)
    return TokenResponse(access_token=token, user_id=user_id, name=body.name, email=body.email)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, password_hash FROM users WHERE email = ?", (body.email,)
        ).fetchone()

    if not row or not service.verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = service.create_jwt(row["id"], body.email)
    return TokenResponse(access_token=token, user_id=row["id"], name=row["name"], email=body.email)
