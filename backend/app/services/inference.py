import onnxruntime as ort
import numpy as np
import pandas as pd
import os
from datetime import timedelta

SEQUENCE_LENGTH = 60

def run_prediction(ticker: str, hist_data: pd.DataFrame, horizon: int = 30) -> dict:
    """
    Runs ONNX inference to predict future log returns, reconstructs prices, 
    and generates confidence bounds.
    """
    # 1. Prepare data
    closes = hist_data['Close'].values.flatten()
    dates = hist_data.index
    
    if len(closes) < SEQUENCE_LENGTH + 1:
        raise ValueError(f"Not enough historical data for {ticker}. Need at least {SEQUENCE_LENGTH + 1} days.")
        
    log_returns = np.log(closes[1:] / closes[:-1])
    
    # Standard deviation of historical returns for confidence bounds
    historical_volatility = np.std(log_returns[-SEQUENCE_LENGTH:])
    
    # 2. Load ONNX Model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'lstm_stock_v1.onnx')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"ONNX model not found at {model_path}")
        
    ort_session = ort.InferenceSession(model_path)
    
    # 3. Iterative Inference
    current_sequence = log_returns[-SEQUENCE_LENGTH:].tolist()
    predicted_returns = []
    
    for _ in range(horizon):
        # Shape: (1, seq_len, 1)
        input_tensor = np.array(current_sequence[-SEQUENCE_LENGTH:], dtype=np.float32).reshape(1, SEQUENCE_LENGTH, 1)
        
        # Run inference
        ort_inputs = {ort_session.get_inputs()[0].name: input_tensor}
        ort_outs = ort_session.run(None, ort_inputs)
        
        pred_return = float(ort_outs[0][0][0])
        predicted_returns.append(pred_return)
        
        # Slide window
        current_sequence.append(pred_return)
        
    # 4. Reconstruct Prices & Confidence Bounds
    last_actual_price = closes[-1]
    last_actual_date = dates[-1]
    
    forecast_data = []
    
    # Add the last known actual price as the starting point of the forecast line
    forecast_data.append({
        "date": last_actual_date.strftime('%Y-%m-%d'),
        "price": round(last_actual_price, 2),
        "is_forecast": False
    })
    
    current_price = last_actual_price
    
    for i, r in enumerate(predicted_returns):
        # P_t = P_{t-1} * exp(r_t)
        current_price = current_price * np.exp(r)
        
        # Z-score for 95% confidence is roughly 1.96
        # Volatility scales with square root of time (sqrt(i+1))
        margin_of_error = 1.96 * historical_volatility * np.sqrt(i + 1)
        
        lower_bound = current_price * np.exp(-margin_of_error)
        upper_bound = current_price * np.exp(margin_of_error)
        
        # Next valid trading day (naive +1 day for now, can be improved with pandas bdate_range)
        # Using simple +1 day to keep it straightforward
        next_date = last_actual_date + timedelta(days=i+1)
        
        forecast_data.append({
            "date": next_date.strftime('%Y-%m-%d'),
            "price": round(current_price, 2),
            "is_forecast": True,
            "lower_bound": round(lower_bound, 2),
            "upper_bound": round(upper_bound, 2)
        })
        
    return {
        "ticker": ticker,
        "model_used": "LSTM v1 (ONNX)",
        "metrics": {
            "historical_volatility": round(float(historical_volatility), 4)
        },
        "data": forecast_data
    }
