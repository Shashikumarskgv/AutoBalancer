"""
FastAPI Machine Learning Service for Game Difficulty Auto-Balancing System
Serves the Champion ML Model for real-time 3-class difficulty adjustment prediction (-1, 0, 1).
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Game Difficulty Auto-Balancing ML Service",
    description="Intelligent 3-class classification ML API for dynamic difficulty balancing",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RuleBasedClassifier:
    """Baseline heuristic classifier"""
    def __init__(self):
        self.name = "Rule-based Baseline"
        
    def fit(self, X, y):
        return self
        
    def predict(self, X):
        predictions = []
        for _, row in X.iterrows():
            curr_diff = row['current_difficulty']
            acc = row['accuracy']
            wr = row['win_rate']
            trend = row['performance_trend']
            cw = row['consecutive_wins']
            cl = row['consecutive_losses']
            if curr_diff < 5 and ((acc > 0.80 and wr > 0.75) or cw >= 3 or trend > 0.15):
                predictions.append(1)
            elif curr_diff > 1 and ((acc < 0.45 and wr < 0.30) or cl >= 3 or trend < -0.15):
                predictions.append(-1)
            else:
                predictions.append(0)
        return np.array(predictions)
        
    def predict_proba(self, X):
        preds = self.predict(X)
        probas = []
        for p in preds:
            if p == -1:
                probas.append([0.8, 0.15, 0.05])
            elif p == 1:
                probas.append([0.05, 0.15, 0.8])
            else:
                probas.append([0.15, 0.70, 0.15])
        return np.array(probas)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models"))
METADATA_PATH = os.path.join(MODELS_DIR, "metadata.json")

# Global model state cache
loaded_models: Dict[str, Any] = {}
loaded_metadata: Dict[str, Any] = {}
active_model_key: str = "gradient_boosting"
scaler: Any = None

def load_system_models():
    global loaded_models, loaded_metadata, active_model_key, scaler
    if not os.path.exists(METADATA_PATH):
        print(f"Warning: Metadata file not found at {METADATA_PATH}")
        return

    with open(METADATA_PATH, "r") as f:
        loaded_metadata = json.load(f)
        
    active_model_key = loaded_metadata.get("active_model_key", "gradient_boosting")
    
    scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
    if os.path.exists(scaler_path):
        scaler = joblib.load(scaler_path)
        
    for key, info in loaded_metadata.get("models", {}).items():
        m_path = info.get("model_path")
        if m_path and os.path.exists(m_path):
            try:
                loaded_models[key] = joblib.load(m_path)
                print(f"Loaded ML model: {info['model_name']} ({key})")
            except Exception as e:
                print(f"Failed to load model {key}: {e}")

load_system_models()


class PredictRequest(BaseModel):
    current_difficulty: int = Field(..., ge=1, le=5, description="Current difficulty level (1-5)")
    accuracy: float = Field(..., ge=0.0, le=1.0, description="Hit accuracy (0-1)")
    win_rate: float = Field(..., ge=0.0, le=1.0, description="Win rate (0-1)")
    death_rate: float = Field(..., ge=0.0, description="Death rate")
    survival_rate: float = Field(..., ge=0.0, le=1.0, description="Survival rate (0-1)")
    average_score: float = Field(..., ge=0.0, description="Average gameplay score")
    reaction_time: float = Field(..., ge=0.0, description="Reaction time in ms")
    completion_time: float = Field(..., ge=0.0, description="Game completion time in seconds")
    performance_trend: float = Field(..., ge=-1.0, le=1.0, description="Performance trend (-1 to 1)")
    consecutive_wins: int = Field(default=0, ge=0, description="Consecutive wins count")
    consecutive_losses: int = Field(default=0, ge=0, description="Consecutive losses count")
    recent_accuracy: Optional[float] = Field(default=None, description="Recent accuracy window")
    recent_win_rate: Optional[float] = Field(default=None, description="Recent win rate window")
    recent_score: Optional[float] = Field(default=None, description="Recent score window")
    games_played: Optional[int] = Field(default=10, description="Total games played")


class PredictResponse(BaseModel):
    adjustment: int = Field(..., description="-1: decrease, 0: maintain, 1: increase")
    confidence: float = Field(..., description="Prediction probability confidence (0-1)")
    recommended_difficulty: int = Field(..., ge=1, le=5, description="Predicted target difficulty clamped to 1-5")
    model_version: str = Field(..., description="Active model version identifier")
    model_name: str = Field(..., description="Name of the model used")
    probabilities: Dict[str, float] = Field(..., description="Class probabilities")
    features_used: Dict[str, float] = Field(..., description="Feature input vector used")


class SwitchModelRequest(BaseModel):
    model_key: str = Field(..., description="Model key to activate (e.g., 'random_forest', 'logistic_regression', 'gradient_boosting', 'rule_based')")


@app.get("/")
def root():
    return {
        "service": "Game Difficulty Auto-Balancing ML API",
        "status": "operational",
        "active_model": active_model_key,
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "active_model": active_model_key,
        "models_loaded": list(loaded_models.keys()),
        "metadata_available": bool(loaded_metadata)
    }


@app.get("/models")
def get_models():
    """Return all available models, their versions, and real evaluated test metrics"""
    if not loaded_metadata:
        load_system_models()
    return {
        "active_model": active_model_key,
        "models": loaded_metadata.get("models", {}),
        "timestamp": loaded_metadata.get("training_timestamp")
    }


@app.post("/models/switch")
def switch_model(payload: SwitchModelRequest):
    global active_model_key
    if payload.model_key not in loaded_metadata.get("models", {}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model key '{payload.model_key}' not found. Available: {list(loaded_metadata.get('models', {}).keys())}"
        )
    active_model_key = payload.model_key
    return {
        "success": True,
        "active_model": active_model_key,
        "model_details": loaded_metadata["models"][active_model_key]
    }


@app.post("/predict", response_model=PredictResponse)
def predict_difficulty(req: PredictRequest):
    if not loaded_models or active_model_key not in loaded_models:
        load_system_models()
        if active_model_key not in loaded_models:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Active model '{active_model_key}' is not ready."
            )
            
    model_info = loaded_metadata.get("models", {}).get(active_model_key, {})
    model = loaded_models[active_model_key]
    
    # Fill defaults for optional features if missing
    recent_acc = req.recent_accuracy if req.recent_accuracy is not None else req.accuracy
    recent_wr = req.recent_win_rate if req.recent_win_rate is not None else req.win_rate
    recent_sc = req.recent_score if req.recent_score is not None else req.average_score
    
    feature_dict = {
        "current_difficulty": req.current_difficulty,
        "accuracy": req.accuracy,
        "win_rate": req.win_rate,
        "death_rate": req.death_rate,
        "survival_rate": req.survival_rate,
        "average_score": req.average_score,
        "reaction_time": req.reaction_time,
        "completion_time": req.completion_time,
        "performance_trend": req.performance_trend,
        "consecutive_wins": req.consecutive_wins,
        "consecutive_losses": req.consecutive_losses,
        "recent_accuracy": recent_acc,
        "recent_win_rate": recent_wr,
        "recent_score": recent_sc
    }
    
    df_features = pd.DataFrame([feature_dict])
    
    # Handle scaling for models that require scaler
    X_input = df_features
    if active_model_key == "logistic_regression" and scaler is not None:
        X_input = scaler.transform(df_features)
        
    try:
        raw_pred = model.predict(X_input)[0]
        adjustment = int(raw_pred)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
        
    # Get probabilities
    probs = {"decrease": 0.0, "maintain": 1.0, "increase": 0.0}
    confidence = 0.85
    if hasattr(model, "predict_proba"):
        try:
            probas = model.predict_proba(X_input)[0]
            # Classes are [-1, 0, 1]
            classes = list(getattr(model, "classes_", [-1, 0, 1]))
            for c, p in zip(classes, probas):
                if c == -1:
                    probs["decrease"] = round(float(p), 4)
                elif c == 0:
                    probs["maintain"] = round(float(p), 4)
                elif c == 1:
                    probs["increase"] = round(float(p), 4)
            confidence = round(float(max(probas)), 4)
        except Exception:
            pass
            
    # Bound guardrail directly at inference:
    # Cannot increase past level 5
    if req.current_difficulty >= 5 and adjustment > 0:
        adjustment = 0
    # Cannot decrease below level 1
    if req.current_difficulty <= 1 and adjustment < 0:
        adjustment = 0
        
    recommended_diff = int(np.clip(req.current_difficulty + adjustment, 1, 5))
    
    return PredictResponse(
        adjustment=adjustment,
        confidence=confidence,
        recommended_difficulty=recommended_diff,
        model_version=model_info.get("version", "v1.0.0"),
        model_name=model_info.get("model_name", "Random Forest Classifier"),
        probabilities=probs,
        features_used={k: round(float(v), 4) for k, v in feature_dict.items()}
    )


@app.post("/retrain")
def retrain():
    """Trigger dataset regeneration and retraining in pipeline"""
    try:
        from ml.datasets.generate_dataset import generate_synthetic_gameplay_data
        from ml.training.train_models import train_and_evaluate_all
        
        generate_synthetic_gameplay_data()
        metadata = train_and_evaluate_all()
        load_system_models()
        return {
            "success": True,
            "message": "Retraining completed successfully",
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting ML Inference Service on http://{host}:{port}...")
    uvicorn.run(app, host=host, port=port)

