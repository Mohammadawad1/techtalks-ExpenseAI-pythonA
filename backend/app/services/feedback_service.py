from sqlalchemy.orm import Session
from ..db.repository import TransactionRepository, FeedbackRepository

class FeedbackService:
    def __init__(self, db: Session):
        self.tx_repo = TransactionRepository(db)
        self.fb_repo = FeedbackRepository(db)

    def apply_feedback(self, transaction_id: int, new_category: str, user_id: int):
        txn = self.tx_repo.get(transaction_id, user_id)
        if txn is None:
            return None

        old = txn.final_category or txn.predicted_category
        txn = self.tx_repo.update_final_category(transaction_id, new_category, user_id)

        from ..db.models import FeedbackRecord
        fb = FeedbackRecord(
            transaction_id=transaction_id,
            description=txn.description,
            amount=txn.amount,
            old_category=old,
            new_category=new_category,
            user_id=user_id
        )
        self.fb_repo.add(fb)
        return txn

    def bulk_apply_feedback(self, updates: list, user_id: int):
        results = []
        for item in updates:
            res = self.apply_feedback(item.transaction_id, item.new_category, user_id)
            if res:
                results.append(res)
        return results
