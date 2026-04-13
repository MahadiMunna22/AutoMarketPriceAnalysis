from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch, pickle, numpy as np
from model import CarPriceModel

app = FastAPI()

# Allow React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load artifacts once at startup ──────────────────────────────
model = CarPriceModel(input_dim=10)
model.load_state_dict(torch.load("ml_data/car_model.pt", map_location="cpu"))
model.eval()

with open("ml_data/scaler_X.pkl", "rb") as f: scaler_X = pickle.load(f)
with open("ml_data/scaler_y.pkl", "rb") as f: scaler_y = pickle.load(f)
with open("ml_data/le_dict.pkl",  "rb") as f: le_dict  = pickle.load(f)

# ── Request schema ───────────────────────────────────────────────
class CarFeatures(BaseModel):
    makeName: str
    modelName: str
    mileage: float
    color_code: float
    fuel_code: float
    transmission: str
    car_type: str
    isNew: bool
    isPremium: bool
    powerOutput: float

# ── Predict endpoint ─────────────────────────────────────────────
@app.post("/predict")
def predict(car: CarFeatures):
    try:
        row = [
            le_dict["makeName"].transform([car.makeName])[0],
            le_dict["modelName"].transform([car.modelName])[0],
            le_dict["Transmission_Decoded"].transform([car.transmission])[0],
            le_dict["Type_Decoded"].transform([car.car_type])[0],
            int(car.isNew),
            int(car.isPremium),
            car.mileage,
            car.powerOutput,
            car.color_code,
            car.fuel_code,
        ]
        x = scaler_X.transform([row]).astype("float32")
        x_tensor = torch.tensor(x)
        with torch.no_grad():
            pred = model(x_tensor).numpy()
        price = float(np.expm1(scaler_y.inverse_transform(pred))[0][0])
        return {"predicted_price": round(price, 2)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health(): return {"status": "ok"}