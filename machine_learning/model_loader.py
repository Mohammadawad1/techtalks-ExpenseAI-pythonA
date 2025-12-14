import os
import pickle
import pandas as pd

MODEL_PATH = "machine_learning/artifacts/expense_model.pkl"
TFIDF_PATH = "machine_learning/artifacts/tfidf.pkl"

_model = None
_tfidf = None


def load_artifacts():
    global _model, _tfidf

    if _model is not None and _tfidf is not None:
        return _model, _tfidf

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    if not os.path.exists(TFIDF_PATH):
        raise FileNotFoundError(f"TF-IDF not found at {TFIDF_PATH}")

    with open(MODEL_PATH, "rb") as f:
        _model = pickle.load(f)

    with open(TFIDF_PATH, "rb") as f:
        _tfidf = pickle.load(f)

    return _model, _tfidf


def predict_one(text: str) -> str:
    if not isinstance(text, str):
        raise ValueError("Input text must be a string")

    model, tfidf = load_artifacts()
    text_vec = tfidf.transform([text])
    return model.predict(text_vec)[0]


def predict_df(df: pd.DataFrame, text_col: str) -> pd.DataFrame:
    """
    Add predicted_category column to df using text_col
    """
    if text_col not in df.columns:
        raise ValueError(f"Missing required column: {text_col}")

    model, tfidf = load_artifacts()

    texts = df[text_col].fillna("").astype(str).tolist()
    X = tfidf.transform(texts)
    preds = model.predict(X)

    out = df.copy()
    out["predicted_category"] = preds
    return out
