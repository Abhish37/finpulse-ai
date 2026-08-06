from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import predict, sectors

app = FastAPI(
    title="FinPulse AI Backend",
    description="Prospective Financial Intelligence API",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # We will add the production Vercel URL later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(predict.router, prefix="/api/v1")
app.include_router(sectors.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
