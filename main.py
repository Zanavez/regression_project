import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sklearn.linear_model import LinearRegression

app = FastAPI()

MODEL_PATH = "files/linear_regression_model_with_ma.pkl"
DATA_PATH = "files/питатели_new.xlsx"

model = joblib.load(MODEL_PATH)


class PredictRequest(BaseModel):
    feeder1: float
    feeder2: float
    feeder3: float


class AddDataRequest(BaseModel):
    feeder1: float
    feeder2: float
    feeder3: float
    weight: float


@app.post("/predict")
def predict(req: PredictRequest):
    X = np.array([[req.feeder1, req.feeder2, req.feeder3]])
    prediction = model.predict(X)[0]
    return {"predicted_weight": round(float(prediction), 2)}


@app.post("/add")
def add_data(req: AddDataRequest):
    global model

    new_row = {
        "Feeder1_Percent": req.feeder1,
        "Feeder2_Percent": req.feeder2,
        "Feeder3_Percent": req.feeder3,
        "Weight_t_h": req.weight
    }

    if os.path.exists(DATA_PATH):
        df = pd.read_excel(DATA_PATH)
    else:
        df = pd.DataFrame(columns=["Feeder1_Percent", "Feeder2_Percent", "Feeder3_Percent", "Weight_t_h"])

    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df.to_excel(DATA_PATH, index=False)

    if len(df) >= 5:
        X = df[["Feeder1_Percent", "Feeder2_Percent", "Feeder3_Percent"]].values
        y = df["Weight_t_h"].values
        new_model = LinearRegression()
        new_model.fit(X, y)
        model = new_model
        joblib.dump(model, MODEL_PATH)
        joblib.dump(model, MODEL_PATH)
        retrained = True
    else:
        retrained = False

    return {"saved": True, "retrained": retrained, "total_rows": len(df)}


@app.get("/stats")
def stats():
    coef = model.coef_.tolist()
    intercept = float(model.intercept_)
    rows = 0
    if os.path.exists(DATA_PATH):
        df = pd.read_excel(DATA_PATH)
        rows = len(df)
    return {
        "intercept": round(intercept, 4),
        "coef_feeder1": round(coef[0], 4),
        "coef_feeder2": round(coef[1], 4),
        "coef_feeder3": round(coef[2], 4),
        "new_data_rows": rows
    }


app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
