from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path
from typing import List, Union

BASE_DIR = Path(__file__).resolve().parents[3]  # ExpenseAI/

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / "backend" / ".env"),
        env_prefix="EXPENSEAI_", 
        extra="ignore"
    )

    # General
    env: str = "development"  # development | production

    # Backend DB
    database_url: str = f"sqlite:///{BASE_DIR / 'backend' / 'expenseai.db'}"

    # ML artifacts (shared folder)
    artifacts_dir: str = str(BASE_DIR / "machine_learning" / "artifacts")

    # JWT Auth
    secret_key: str = "d20b66687258380486b767d8d21c435e076770258167f5370d7426e2e5843431" 
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7 # 1 week

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:5173", "http://127.0.0.1:5173", 
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:3000", "http://127.0.0.1:3000"
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

settings = Settings()
