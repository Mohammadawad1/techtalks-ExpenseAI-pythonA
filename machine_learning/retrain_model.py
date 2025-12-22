from __future__ import annotations
import pandas as pd
from sqlalchemy import create_engine, text
from .constants import DATASET_PROCESSED, SQLALCHEMY_URL
from .train_model import main as train_main

def main():
    engine = create_engine(SQLALCHEMY_URL, connect_args={"check_same_thread": False})

    base = pd.read_csv(DATASET_PROCESSED)
    base_rows = len(base)

    # corrections from feedback table
    with engine.connect() as conn:
        # feedback schema: description, amount, new_category
        res = conn.execute(text("SELECT description, amount, new_category FROM feedback"))
        rows = res.fetchall()

    corr = pd.DataFrame(rows, columns=["description", "amount", "category"])
    corr_rows = len(corr)

    print(f"Base clean rows: {base_rows}")
    print(f"Corrections rows: {corr_rows}")

    if corr_rows > 0:
        # Make base compatible: ensure it has category column
        # If base already has category -> keep it; else fail clearly
        if "category" not in base.columns:
            raise ValueError("Processed dataset must contain a 'category' column for training.")
        combined = pd.concat([base, corr[["description", "category"]]], ignore_index=True)
        combined.to_csv(DATASET_PROCESSED, index=False)

    # Train again (overwrites artifacts)
    train_main()

if __name__ == "__main__":
    main()
