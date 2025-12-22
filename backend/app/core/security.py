from fastapi import Header, HTTPException
from .config import settings

def require_token(x_api_token: str | None = Header(default=None)):
    # Keep it simple (MVP). You can remove this if you want open endpoints.
    if x_api_token != settings.api_token:
        raise HTTPException(status_code=401, detail="Invalid or missing API token")
