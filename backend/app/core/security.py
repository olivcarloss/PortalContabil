import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

_JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
_jwks_cache: dict | None = None
_jwks_cached_at: float = 0
_JWKS_TTL_SECONDS = 3600


class CurrentUser:
    def __init__(self, id: str, email: str | None, claims: dict):
        self.id = id
        self.email = email
        self.claims = claims


def _get_jwks() -> dict:
    """Projetos Supabase recentes assinam tokens com chaves assimetricas (ES256),
    publicadas no endpoint JWKS do projeto — nao existe mais um segredo estatico
    para validar o token (o antigo SUPABASE_JWT_SECRET/HS256 nao se aplica aqui)."""
    global _jwks_cache, _jwks_cached_at
    if _jwks_cache is None or (time.time() - _jwks_cached_at) > _JWKS_TTL_SECONDS:
        resp = httpx.get(_JWKS_URL, timeout=5)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_cached_at = time.time()
    return _jwks_cache


def decode_supabase_jwt(token: str) -> dict:
    if not settings.supabase_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_URL nao configurado no backend",
        )
    try:
        unverified_header = jwt.get_unverified_header(token)
        jwks = _get_jwks()
        key = next(
            (k for k in jwks["keys"] if k["kid"] == unverified_header.get("kid")), None
        )
        if key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Chave de assinatura do token nao encontrada (kid desconhecido)",
            )
        return jwt.decode(
            token,
            key,
            algorithms=[key.get("alg", "ES256")],
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido ou expirado",
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
        )
    claims = decode_supabase_jwt(credentials.credentials)
    return CurrentUser(id=claims["sub"], email=claims.get("email"), claims=claims)
