from __future__ import annotations
import json
from pathlib import Path
import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score

from .constants import DATASET_PROCESSED, ARTIFACTS_DIR
from .features import normalize_text


def _detect_columns(df: pd.DataFrame) -> tuple[str, str]:
    # Expect: description + category
    cand_desc = ["description", "desc", "merchant"]
    cand_cat = ["category", "label", "type"]

    def find(cands):
        cols = {c.lower(): c for c in df.columns}
        for c in cands:
            if c.lower() in cols:
                return cols[c.lower()]
        return None

    dcol = find(cand_desc)
    ccol = find(cand_cat)

    if dcol is None or ccol is None:
        raise ValueError(
            f"Processed dataset must include description + category. Found: {list(df.columns)}"
        )
    return dcol, ccol


def main(user_id: str | int | None = None, train_path: Path | str | None = None):
    suffix = f"_{user_id}" if user_id is not None else ""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    base_path = Path(DATASET_PROCESSED).parent  
    train_path = Path(train_path) if train_path else (base_path / "dataset_train.csv")
    test_path = base_path / "dataset_test.csv"

    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    
    dcol, ccol = _detect_columns(train_df)

  
    train_df = train_df[[dcol, ccol]].dropna()
    test_df = test_df[[dcol, ccol]].dropna()

    train_df[dcol] = train_df[dcol].astype(str).map(normalize_text)
    test_df[dcol] = test_df[dcol].astype(str).map(normalize_text)

    train_df[ccol] = train_df[ccol].astype(str).str.strip()
    test_df[ccol] = test_df[ccol].astype(str).str.strip()

    
    X_train = train_df[dcol].values
    y_train = train_df[ccol].values

    X_test = test_df[dcol].values
    y_test = test_df[ccol].values

    print("X_train:", len(X_train), "X_test:", len(X_test))

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        max_features=20000,
    )
    Xtr = vectorizer.fit_transform(X_train)
    Xte = vectorizer.transform(X_test)

    # Encode labels
    le = LabelEncoder()
    # Fit on ALL possible labels from both sets to prevent "unseen label" errors
    all_labels = pd.concat([train_df[ccol], test_df[ccol]])
    le.fit(all_labels)
    
    ytr = le.transform(train_df[ccol])
    yte = le.transform(test_df[ccol])

    model = LogisticRegression(max_iter=2000, n_jobs=None)
    model.fit(Xtr, ytr)

    pred = model.predict(Xte)
    acc = float(accuracy_score(yte, pred))
    
    # Explicitly pass all labels to ensure target_names matches
    all_classes = list(le.classes_)
    report = classification_report(
        yte, 
        pred, 
        labels=range(len(all_classes)),
        target_names=all_classes, 
        output_dict=True
    )

    joblib.dump(vectorizer, ARTIFACTS_DIR / f"vectorizer{suffix}.joblib")
    joblib.dump(model, ARTIFACTS_DIR / f"model{suffix}.joblib")
    joblib.dump(le, ARTIFACTS_DIR / f"label_encoder{suffix}.joblib")

    metrics = {"accuracy": acc, "report": report, "classes": list(le.classes_)}
    (ARTIFACTS_DIR / f"metrics{suffix}.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )

    print(f"Saved artifacts to: {ARTIFACTS_DIR}")
    print(f"Accuracy: {acc:.4f}")
    print(
        classification_report(
            yte, 
            pred, 
            labels=range(len(all_classes)),
            target_names=all_classes
        )
    )


if __name__ == "__main__":
    main()
