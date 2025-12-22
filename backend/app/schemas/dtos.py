from pydantic import BaseModel
from datetime import date

class TransactionOut(BaseModel):
    id: int
    txn_date: date | None
    description: str
    amount: float
    predicted_category: str | None
    final_category: str | None
    confidence: float | None

    class Config:
        from_attributes = True

class CategoryListOut(BaseModel):
    categories: list[str]

class CategoryCreateIn(BaseModel):
    name: str

class FeedbackIn(BaseModel):
    transaction_id: int
    new_category: str

class RetrainOut(BaseModel):
    base_rows: int
    corrections_rows: int
    artifacts_dir: str
