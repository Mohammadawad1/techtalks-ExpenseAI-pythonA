# save_as: generate_expense_dataset_better.py
import pandas as pd
import uuid
import random
from datetime import datetime, timedelta

# Seed for reproducibility
random.seed(42)

# Base descriptions with more context words
descriptions_base = [
    "STARBUCKS - Coffee & Snacks", "Carrefour - Grocery Shopping", "TotalEnergies Fuel Purchase",
    "Uber Trip to Downtown", "Alfa Telecom Monthly Bill", "Ogero Internet Payment",
    "Pharmacy One - Medication Purchase", "Restaurant Dinner with Family",
    "Salary Monthly Deposit", "ATM Cash Withdrawal", "Shein Online Store Shopping",
    "Spotify Music Subscription", "Gym Monthly Membership", "Hospital Visit & Consultation",
    "QuickTransfer to Friend", "Bank Fees Payment", "Electricity Bill Payment", "Water Bill Payment",
    "Amazon Online Purchase", "Zara Online Shopping", "McDonald's Meal with Drinks",
    "Bakery Purchase - Bread & Pastry", "Vehicle Maintenance & Repair", "Cinema Movie Ticket",
    "School Tuition Payment", "Insurance Premium Payment", "Car Rental - Weekend Trip",
    "Office Supplies Purchase", "Consulting Fee Payment", "Petrol Station Fuel",
    "Mobile Topup Recharge", "Gift Purchase for Birthday", "Charity Donation Contribution"
]

# Categories mapping
categories = {
    "Food & Dining": ["STARBUCKS", "Restaurant", "McDonald's", "Bakery", "Meal"],
    "Shopping": ["Carrefour", "Shein", "Zara", "Amazon", "Purchase", "Gift"],
    "Transportation": ["Uber", "Fuel", "Vehicle", "Car Rental", "Petrol", "Petrol Station"],
    "Bills & Utilities": ["Alfa", "Ogero", "Electricity", "Water", "Mobile Topup"],
    "Health & Medical": ["Pharmacy", "Hospital", "Insurance"],
    "Entertainment": ["Spotify", "Gym", "Cinema", "Ticket"],
    "Income & Transfers": ["Salary", "Deposit", "Transfer", "Consulting Fee"],
    "Education": ["School", "Tuition"],
    "Other": ["Bank Fees", "Charity", "ATM"]
}

def categorize(desc):
    for cat, keys in categories.items():
        if any(k.lower() in desc.lower() for k in keys):
            return cat
    return "Other"

def generate_dataset(n=10000, out_path="expenseAI_dataset.csv"):
    rows = []
    today = datetime.today()
    for i in range(n):
        desc = random.choice(descriptions_base)
        # Add extra context randomly
        extra_phrases = [
            "for personal use", "with family", "monthly expense", "urgent payment",
            "online order", "special discount", "weekend activity", "monthly subscription"
        ]
        if random.random() < 0.5:  # 50% chance to add extra phrase
            desc = f"{desc} - {random.choice(extra_phrases)}"
        # Add minor variability
        if random.random() < 0.2:
            desc = f"{desc} #{random.randint(1,999)}"
        amount = round(random.uniform(5, 5000), 2)
        date = today - timedelta(days=random.randint(0, 730))
        created_at = date + timedelta(days=random.randint(0,5))
        rows.append({
            "transaction_id": str(uuid.uuid4()),
            "date": date.strftime("%Y-%m-%d"),
            "description": desc,
            "amount": amount,
            "category": categorize(desc),
            "created_at": created_at.strftime("%Y-%m-%d")
        })
    df = pd.DataFrame(rows)
    df.to_csv(out_path, index=False)
    print(f"Saved {n} rows to {out_path}")
    return df

if __name__ == "__main__":
    generate_dataset(10000, "expenseAI_dataset.csv")
