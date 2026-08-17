from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.accounting.router import router as accounting_router
from app.modules.admin.router import router as admin_router
from app.modules.licensing.router import router as licensing_router

app = FastAPI(title="PortalContabil.cloud API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(licensing_router, prefix="/api")
app.include_router(accounting_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
