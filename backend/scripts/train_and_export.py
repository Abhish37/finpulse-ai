import yfinance as yf
import numpy as np
import torch
import torch.nn as nn
import os

# 1. Fetch Real Data
print("Fetching real historical data from yfinance (AAPL)...")
data = yf.download('AAPL', period='2y', interval='1d')
closes = data['Close'].values

# Calculate log returns
# r_t = ln(P_t / P_{t-1})
log_returns = np.log(closes[1:] / closes[:-1])

# 2. Prepare Sequences
SEQUENCE_LENGTH = 60
X, y = [], []
for i in range(len(log_returns) - SEQUENCE_LENGTH):
    X.append(log_returns[i : i + SEQUENCE_LENGTH])
    y.append(log_returns[i + SEQUENCE_LENGTH])

X = np.array(X, dtype=np.float32).reshape(-1, SEQUENCE_LENGTH, 1)
y = np.array(y, dtype=np.float32).reshape(-1, 1)

# Convert to PyTorch tensors
X_tensor = torch.tensor(X)
y_tensor = torch.tensor(y)

# 3. Define LSTM Model
class StockLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=2, output_size=1):
        super(StockLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        # x shape: (batch, seq_len, features)
        out, (hn, cn) = self.lstm(x)
        # Take the output of the last time step
        out = self.fc(out[:, -1, :])
        return out

model = StockLSTM()
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

# 4. Train Model (Briefly)
epochs = 5
print(f"Training model for {epochs} epochs...")
for epoch in range(epochs):
    model.train()
    optimizer.zero_grad()
    outputs = model(X_tensor)
    loss = criterion(outputs, y_tensor)
    loss.backward()
    optimizer.step()
    print(f"Epoch {epoch+1}/{epochs}, Loss: {loss.item():.6f}")

# 5. Export to ONNX
model.eval()
dummy_input = torch.randn(1, SEQUENCE_LENGTH, 1)
onnx_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'models', 'lstm_stock_v1.onnx')

os.makedirs(os.path.dirname(onnx_path), exist_ok=True)
torch.onnx.export(
    model, 
    dummy_input, 
    onnx_path,
    export_params=True,
    opset_version=14,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)

print(f"Model successfully exported to {onnx_path}")
