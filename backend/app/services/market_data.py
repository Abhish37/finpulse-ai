import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def fetch_historical_data(ticker: str, years: int = 2) -> pd.DataFrame:
    """
    Fetches real historical OHLCV data using yfinance.
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * years)
    
    df = yf.download(ticker, start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))
    
    if df.empty:
        raise ValueError(f"No data found for ticker {ticker}")
        
    return df
