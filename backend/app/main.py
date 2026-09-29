from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .db.models import init_db
from .api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

cors_origins = settings.CORS_ORIGINS
allow_all = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if allow_all else cors_origins,
    allow_origin_regex=r".*" if allow_all else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {"system": settings.PROJECT_NAME, "version": settings.VERSION,
            "docs": f"{settings.API_V1_STR}/docs", "health": f"{settings.API_V1_STR}/health"}
