from fastapi import Header, HTTPException, Request
from .config import settings
from typing import Optional

def require_token(request: Request, x_api_token: Optional[str] = Header(None, alias="X-API-Token")):
    # Skip token check for OPTIONS (CORS preflight)
    if request.method == "OPTIONS":
        return
    
    # Keep it simple (MVP). You can remove this if you want open endpoints.
    if x_api_token != settings.api_token:
        raise HTTPException(status_code=401, detail="Invalid or missing API token")
