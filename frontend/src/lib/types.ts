export interface PredictionDataPoint {
  date: string;
  price: number;
  is_forecast: boolean;
  lower_bound?: number;
  upper_bound?: number;
}

export interface PredictionMetrics {
  historical_volatility: number;
}

export interface ForecastContract {
  asset: string;
  issued_at: string;
  horizon: string;
  state: string;
  probability_up: number;
  probability_down: number;
  probability_neutral: number;
  expected_return: number;
  prediction_interval_80: number[];
  regime: string;
  invalidation_level: number;
  catalysts: string[];
  risk_flags: string[];
  confidence: string;
  calibration_score: number;
  expiry: string;
}

export interface PredictionResponse {
  ticker: string;
  model_used: string;
  metrics: {
    historical_volatility: number;
  };
  contract?: ForecastContract;
  data: PredictionDataPoint[];
  cached_fallback?: boolean;
}
