import os
import json
from upstash_redis import Redis
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from typing import List, Optional
from ..services.market_data import fetch_historical_data
from ..services.inference import run_prediction

router = APIRouter()

# Initialize Redis (L2 Caching)
try:
    redis_url = os.environ.get("UPSTASH_REDIS_REST_URL")
    redis_token = os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    if redis_url and redis_token:
        redis = Redis(url=redis_url, token=redis_token)
    else:
        redis = None
except Exception:
    redis = None

class PredictionDataPoint(BaseModel):
    date: str
    price: float
    is_forecast: bool
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class ForecastContract(BaseModel):
    asset: str
    issued_at: str
    horizon: str
    state: str
    probability_up: float
    probability_down: float
    probability_neutral: float
    expected_return: float
    prediction_interval_80: List[float]
    regime: str
    invalidation_level: float
    catalysts: List[str]
    risk_flags: List[str]
    confidence: str
    calibration_score: float
    expiry: str

class PredictionResponse(BaseModel):
    ticker: str
    model_used: str
    metrics: dict
    contract: ForecastContract
    data: List[PredictionDataPoint]

@router.get("/predict/{ticker}", response_model=PredictionResponse)
async def get_prediction(
    ticker: str = Path(..., title="The stock ticker symbol", min_length=1, max_length=10),
    horizon: int = 30
):
    cache_key = f"forecast:{ticker.upper()}:LSTM:{horizon}"
    
    # 1. Try Cache
    if redis:
        try:
            cached_data = redis.get(cache_key)
            if cached_data:
                # Upstash Redis for Python parses JSON strings automatically sometimes, 
                # but we'll try json.loads just in case it returns a string.
                if isinstance(cached_data, str):
                    return json.loads(cached_data)
                return cached_data
        except Exception as e:
            print(f"Redis Error: {e}")

    try:
        # 2. Fetch real historical data (last 2 years to get enough context)
        hist_data = fetch_historical_data(ticker.upper())
        
        # 3. Run inference
        forecast_result = run_prediction(ticker.upper(), hist_data, horizon)
        
        # 4. Save to Cache (900s TTL = 15 min)
        if redis:
            try:
                redis.setex(cache_key, 900, json.dumps(forecast_result))
            except Exception as e:
                print(f"Redis Cache Set Error: {e}")
                
        return forecast_result

    except Exception as e:
        print(f"Prediction Error for {ticker}: {e}")
        # Rate Limit Fallback: If yfinance fails, try to serve from Redis even if expired (if possible)
        # For our current implementation, we just serve what we have if it exists.
        if redis:
            try:
                cached_data = redis.get(cache_key)
                if cached_data:
                    data = json.loads(cached_data) if isinstance(cached_data, str) else cached_data
                    data["cached_fallback"] = True
                    return data
            except Exception as redis_e:
                pass
        
        raise HTTPException(status_code=500, detail=f"Failed to generate forecast: {str(e)}")

