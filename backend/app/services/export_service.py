import pandas as pd
from ..db.models import TransactionRecord

class ExportService:
    def to_dataframe(self, txns: list[TransactionRecord]) -> pd.DataFrame:
        rows = []
        for t in txns:
            rows.append({
                "id": t.id,
                "txn_date": t.txn_date,
                "description": t.description,
                "amount": t.amount,
                "predicted_category": t.predicted_category,
                "final_category": t.final_category,
                "confidence": t.confidence,
            })
        return pd.DataFrame(rows)
