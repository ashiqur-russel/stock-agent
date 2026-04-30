from typing import Annotated

from fastapi import Header, HTTPException, status

from auth.service import decode_jwt


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    """Require Bearer JWT. Missing header returns 401 (not 422 — FastAPI treats required Header(...) as a validation error)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    return decode_jwt(token)
