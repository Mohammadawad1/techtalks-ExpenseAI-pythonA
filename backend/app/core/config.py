from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]  # ExpenseAI/

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EXPENSEAI_", extra="ignore")

    # Backend DB
    database_url: str = f"sqlite:///{BASE_DIR / 'backend' / 'expenseai.db'}"

    # ML artifacts (shared folder)
    artifacts_dir: str = str(BASE_DIR / "machine_learning" / "artifacts")

    # Basic auth token for demo (optional)
    api_token: str = "dev-token"

settings = Settings()
