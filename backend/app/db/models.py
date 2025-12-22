from sqlalchemy import Column, Integer, String, Float, Date, DateTime, func
from .database import Base

class TransactionRecord(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, default="upload")  # e.g. "upload"
    txn_date = Column(Date, nullable=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)

    predicted_category = Column(String, nullable=True)
    final_category = Column(String, nullable=True)  # user-verified category
    confidence = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FeedbackRecord(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)

    old_category = Column(String, nullable=True)
    new_category = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CategoryRecord(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
