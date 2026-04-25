from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str


class VerificationPending(BaseModel):
    requires_verification: bool = True
    email: str
    message: str


class ResendRequest(BaseModel):
    email: EmailStr
