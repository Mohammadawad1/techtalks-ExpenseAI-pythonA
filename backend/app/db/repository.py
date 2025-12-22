from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from .models import TransactionRecord, FeedbackRecord, CategoryRecord

class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_many(self, rows: list[TransactionRecord]) -> list[TransactionRecord]:
        self.db.add_all(rows)
        self.db.commit()
        for r in rows:
            self.db.refresh(r)
        return rows

    def list_all(self) -> list[TransactionRecord]:
        return list(self.db.execute(select(TransactionRecord).order_by(TransactionRecord.id.desc())).scalars())

    def get(self, txn_id: int) -> TransactionRecord | None:
        return self.db.get(TransactionRecord, txn_id)

    def update_final_category(self, txn_id: int, category: str):
        txn = self.get(txn_id)
        if txn:
            txn.final_category = category
            self.db.commit()
            self.db.refresh(txn)
        return txn

class FeedbackRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, fb: FeedbackRecord) -> FeedbackRecord:
        self.db.add(fb)
        self.db.commit()
        self.db.refresh(fb)
        return fb

    def list_all(self) -> list[FeedbackRecord]:
        return list(self.db.execute(select(FeedbackRecord).order_by(FeedbackRecord.id.desc())).scalars())

    def clear_all(self):
        self.db.execute(delete(FeedbackRecord))
        self.db.commit()

class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def ensure_defaults(self, names: list[str]):
        existing = {c.name for c in self.db.execute(select(CategoryRecord)).scalars()}
        for n in names:
            if n not in existing:
                self.db.add(CategoryRecord(name=n))
        self.db.commit()

    def list_all(self) -> list[str]:
        return [c.name for c in self.db.execute(select(CategoryRecord).order_by(CategoryRecord.name.asc())).scalars()]

    def add(self, name: str) -> str:
        self.db.add(CategoryRecord(name=name))
        self.db.commit()
        return name
