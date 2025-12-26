from __future__ import annotations
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

class MLService:
    """
    Loads artifacts from machine_learning/artifacts and predicts categories.
    Artifacts expected:
      - vectorizer.joblib (TfidfVectorizer)
      - model.joblib (sklearn classifier)
      - label_encoder.joblib (LabelEncoder)
    """
    def __init__(self, artifacts_dir: str, user_id: int | None = None):
        d = Path(artifacts_dir)
        suffix = f"_{user_id}" if user_id is not None else ""
        
        # Check if personalized model exists, otherwise use global baseline
        self.vectorizer_path = d / f"vectorizer{suffix}.joblib"
        self.model_path = d / f"model{suffix}.joblib"
        self.le_path = d / f"label_encoder{suffix}.joblib"

        # Fallback to global if user model isn't trained yet
        if user_id and not self.model_path.exists():
            self.vectorizer_path = d / "vectorizer.joblib"
            self.model_path = d / "model.joblib"
            self.le_path = d / "label_encoder.joblib"

        self._vectorizer = None
        self._model = None
        self._le = None

    def is_ready(self) -> bool:
        return self.vectorizer_path.exists() and self.model_path.exists() and self.le_path.exists()

    def _load(self):
        if self._model is None:
            self._vectorizer = joblib.load(self.vectorizer_path)
            self._model = joblib.load(self.model_path)
            self._le = joblib.load(self.le_path)

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_ready():
            # Fallback: rule-based minimal baseline
            return self._predict_fallback(df)

        self._load()

        texts = (df["description"].astype(str).fillna("").str.lower()).tolist()
        X = self._vectorizer.transform(texts)
        proba = None
        if hasattr(self._model, "predict_proba"):
            proba = self._model.predict_proba(X)
            pred_idx = np.argmax(proba, axis=1)
            confidence = np.max(proba, axis=1)
        else:
            pred_idx = self._model.predict(X)
            confidence = np.ones(len(texts), dtype=float) * 0.50

        labels = self._le.inverse_transform(pred_idx)
        out = df.copy()
        out["predicted_category"] = labels
        out["confidence"] = confidence.astype(float)
        return out

    def _predict_fallback(self, df: pd.DataFrame) -> pd.DataFrame:
        def rule(desc: str, amount: float) -> tuple[str, float]:
            d = (desc or "").lower()
            if amount < 0:
                return ("income_&_transfers", 0.55)
            if any(k in d for k in ["uber", "careem", "fuel", "gas", "taxi", "bus", "metro"]):
                return ("transportation", 0.55)
            if any(k in d for k in ["netflix", "spotify", "cinema", "movie", "steam"]):
                return ("entertainment", 0.55)
            if any(k in d for k in ["pharmacy", "doctor", "hospital", "clinic"]):
                return ("health_&_medical", 0.55)
            if any(k in d for k in ["electric", "internet", "water", "phone", "utility"]):
                return ("bills_&_utilities", 0.55)
            if any(k in d for k in ["restaurant", "cafe", "coffee", "pizza", "burger", "grocery", "supermarket"]):
                return ("food_&_dining", 0.55)
            if any(k in d for k in ["amazon", "mall", "store", "shopping", "clothes"]):
                return ("shopping", 0.55)
            return ("other", 0.50)

        out = df.copy()
        preds = [rule(r["description"], float(r["amount"])) for _, r in out.iterrows()]
        out["predicted_category"] = [p[0] for p in preds]
        out["confidence"] = [p[1] for p in preds]
        return out
