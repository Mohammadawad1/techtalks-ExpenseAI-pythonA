# save_as: run_test.py
import pandas as pd
from db import insert_transactions_dataframe
from dev_utils import create_demo_user_if_not_exists

# 1) نضمن وجود user
user_id = create_demo_user_if_not_exists()
print("Using user_id =", user_id)

# 2) نعمل DataFrame تجريبي
df = pd.DataFrame([
    {
        "date": "2025-01-10",
        "description": "Test Store",
        "amount": 20.5,
        "category": "food_&_dining",
        "raw_category": "food_&_dining",   # لو من الموديل، حالياً بس تجريبي
    }
])

# 3) نعمل إدخال
insert_transactions_dataframe(df, user_id=user_id)
print("Inserted sample row successfully into PostgreSQL!")
