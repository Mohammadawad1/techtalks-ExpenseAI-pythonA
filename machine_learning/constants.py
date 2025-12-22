from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]  # ExpenseAI/

DATASET_PROCESSED = PROJECT_ROOT / "dataset" / "processed" / "expenseAI_cleaned_dataset.csv"
DATASET_RAW_DIR = PROJECT_ROOT / "dataset" / "raw"

ARTIFACTS_DIR = PROJECT_ROOT / "machine_learning" / "artifacts"

# Backend DB (same file used by FastAPI)
BACKEND_DB = PROJECT_ROOT / "backend" / "expenseai.db"
SQLALCHEMY_URL = f"sqlite:///{BACKEND_DB}"
