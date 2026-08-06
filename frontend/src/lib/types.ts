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

export interface PredictionResponse {
  ticker: string;
  model_used: string;
  metrics: PredictionMetrics;
  data: PredictionDataPoint[];
}
