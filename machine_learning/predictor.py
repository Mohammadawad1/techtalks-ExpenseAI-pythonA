from pathlib import Path
import joblib
import pandas as pd
import numpy as np
from .features import normalize_text

class ExpensePredictor:
    def __init__(self, artifacts_dir: str | Path):
        d = Path(artifacts_dir)
        self.vectorizer = joblib.load(d / "vectorizer.joblib")
        self.model = joblib.load(d / "model.joblib")
        self.le = joblib.load(d / "label_encoder.joblib")

    def predict_df(self, df: pd.DataFrame) -> pd.DataFrame:
        texts = df["description"].astype(str).fillna("").map(normalize_text).tolist()
        X = self.vectorizer.transform(texts)

        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(X)
            pred_idx = np.argmax(proba, axis=1)
            conf = np.max(proba, axis=1)
        else:
            pred_idx = self.model.predict(X)
            conf = np.ones(len(texts), dtype=float) * 0.50

        labels = self.le.inverse_transform(pred_idx)
        out = df.copy()
        out["predicted_category"] = labels
        out["confidence"] = conf.astype(float)
        return out
