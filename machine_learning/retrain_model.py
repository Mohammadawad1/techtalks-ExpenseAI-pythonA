from __future__ import annotations
import pandas as pd
from sqlalchemy import create_engine, text
from .constants import DATASET_PROCESSED, SQLALCHEMY_URL
from .train_model import main as train_main

import sys
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--user-id", type=int, help="Optional user ID to isolate training")
    args = parser.parse_args()

    engine = create_engine(SQLALCHEMY_URL, connect_args={"check_same_thread": False})

    base = pd.read_csv(DATASET_PROCESSED)
    base_rows = len(base)

    # corrections from feedback table
    with engine.connect() as conn:
        query = "SELECT description, amount, new_category FROM feedback"
        params = {}
        if args.user_id:
            query += " WHERE user_id = :user_id"
            params["user_id"] = args.user_id
        
        res = conn.execute(text(query), params)
        rows = res.fetchall()

    corr = pd.DataFrame(rows, columns=["description", "amount", "category"])
    corr_rows = len(corr)

    # We always print these so the backend can parse them from stdout
    print(f"Base clean rows: {base_rows}")
    print(f"Corrections rows: {corr_rows}")

    if args.user_id:
        # Isolated training: use a temporary file to avoid polluting the global base dataset
        if "category" not in base.columns:
            raise ValueError("Processed dataset must contain a 'category' column.")
            
        combined = pd.concat([base, corr[["description", "category"]]], ignore_index=True)
        combined = combined.drop_duplicates()
        
        tmp_path = DATASET_PROCESSED.parent / f"dataset_train_tmp_{args.user_id}.csv"
        combined.to_csv(tmp_path, index=False)
        
        # Train with user suffix and temporary data
        train_main(user_id=args.user_id, train_path=tmp_path)
        
        # Cleanup temporary file
        if tmp_path.exists():
            tmp_path.unlink()
    else:
        # Global retrain (fallback/admin)
        if corr_rows > 0:
            if "category" not in base.columns:
                raise ValueError("Processed dataset must contain a 'category' column.")
            combined = pd.concat([base, corr[["description", "category"]]], ignore_index=True)
            combined = combined.drop_duplicates()
            combined.to_csv(DATASET_PROCESSED, index=False)
        train_main()

if __name__ == "__main__":
    main()
