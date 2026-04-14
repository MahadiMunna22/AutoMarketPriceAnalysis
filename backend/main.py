from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch, pickle, numpy as np
from model import CarPriceModel

app = FastAPI()

# Allow React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://auto-market-price-analysis.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load artifacts once at startup ──────────────────────────────
model = CarPriceModel(input_dim=9)
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
    color_code: str
    fuel_code: str
    transmission: str
    car_type: str
    isPremium: bool
    first_reg_year: float

# ── Predict endpoint ─────────────────────────────────────────────
@app.post("/predict")
def predict(car: CarFeatures):
    try:
        row = [
            le_dict["makeName"].transform([car.makeName])[0],
            le_dict["modelName"].transform([car.modelName])[0],
            le_dict["Transmission_Decoded"].transform([car.transmission])[0],
            le_dict["Type_Decoded"].transform([car.car_type])[0],
            le_dict['Color_Decoded'].transform([car.color_code])[0], 
            le_dict['Fuel_Decoded'].transform([car.fuel_code])[0],   
            int(car.isPremium),
            float(car.mileage),
            float(car.first_reg_year),
        ]
        x = scaler_X.transform([row]).astype("float32")
        x_tensor = torch.tensor(x)
        with torch.no_grad():
            pred = model(x_tensor).cpu().numpy()

        price = float(np.expm1(scaler_y.inverse_transform(pred))[0][0])
        return {"predicted_price": round(price, 2)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health(): return {"status": "ok"}