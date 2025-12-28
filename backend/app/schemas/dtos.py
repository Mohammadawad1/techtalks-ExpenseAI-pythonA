from pydantic import BaseModel
from datetime import date, datetime

class TransactionOut(BaseModel):
    id: int
    txn_date: date | None
    description: str
    amount: float
    predicted_category: str | None
    final_category: str | None
    confidence: float | None
    created_at: datetime | None

    class Config:
        from_attributes = True

class CategoryListOut(BaseModel):
    categories: list[str]

class CategoryCreateIn(BaseModel):
    name: str

class TransactionCreateIn(BaseModel):
    txn_date: date
    description: str
    amount: float
    category: str | None = None

class TransactionUpdateIn(BaseModel):
    txn_date: date
    description: str
    amount: float
    category: str | None = None

class FeedbackIn(BaseModel):
    transaction_id: int
    new_category: str

class BulkFeedbackIn(BaseModel):
    updates: list[FeedbackIn]

class RetrainOut(BaseModel):
    base_rows: int
    corrections_rows: int
    artifacts_dir: str

# Auth DTOs
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    created_at: date | datetime = None # use datetime if preferred
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
