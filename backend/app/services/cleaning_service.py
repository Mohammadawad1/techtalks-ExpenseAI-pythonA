from __future__ import annotations
import pandas as pd
from datetime import datetime

class CleaningService:
    """
    Cleans uploaded CSV into normalized schema:
    - txn_date: date (optional)
    - description: string
    - amount: float (positive spending, negative income optional)
    """

    CANDIDATE_DATE_COLS = ["date", "txn_date", "transaction_date", "Date", "Transaction Date"]
    CANDIDATE_DESC_COLS = ["description", "desc", "narration", "merchant", "Details", "Description"]
    CANDIDATE_AMOUNT_COLS = ["amount", "Amount", "amt", "value", "transaction_amount"]

    def load_csv(self, file_path_or_buffer) -> pd.DataFrame:
        df = pd.read_csv(file_path_or_buffer)
        return df

    def _find_first_col(self, df: pd.DataFrame, candidates: list[str]) -> str | None:
        cols = set(df.columns)
        for c in candidates:
            if c in cols:
                return c
        # also try case-insensitive match
        lower_map = {c.lower(): c for c in df.columns}
        for cand in candidates:
            k = cand.lower()
            if k in lower_map:
                return lower_map[k]
        return None

    def normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        date_col = self._find_first_col(df, self.CANDIDATE_DATE_COLS)
        desc_col = self._find_first_col(df, self.CANDIDATE_DESC_COLS)
        amt_col = self._find_first_col(df, self.CANDIDATE_AMOUNT_COLS)

        if desc_col is None or amt_col is None:
            raise ValueError(
                "CSV must contain at least description and amount columns. "
                f"Found columns: {list(df.columns)}"
            )

        out = pd.DataFrame()
        if date_col:
            out["txn_date"] = pd.to_datetime(df[date_col], errors="coerce").dt.date
        else:
            out["txn_date"] = pd.NaT

        out["description"] = df[desc_col].astype(str).fillna("").str.strip()
        out["amount"] = pd.to_numeric(df[amt_col], errors="coerce")

        # Drop invalid
        out = out.dropna(subset=["amount"])
        out = out[out["description"].str.len() > 0]

        # Ensure float
        out["amount"] = out["amount"].astype(float)

        return out.reset_index(drop=True)
