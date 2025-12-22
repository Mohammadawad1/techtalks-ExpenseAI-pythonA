from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import pandas as pd
import subprocess
import sys
from pathlib import Path

from .core.config import settings
from .core.security import require_token
from .db.database import Base, engine, get_db
from .db.models import TransactionRecord
from .db.repository import TransactionRepository, CategoryRepository
from .schemas.dtos import (
    TransactionOut, CategoryListOut, CategoryCreateIn, FeedbackIn, RetrainOut
)
from .services.cleaning_service import CleaningService
from .services.ml_service import MLService
from .services.feedback_service import FeedbackService
from .services.category_service import DEFAULT_CATEGORIES
from .services.export_service import ExportService

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ExpenseAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_seed():
    # Ensure default categories exist (per project category structure).
    from .db.database import SessionLocal
    db = SessionLocal()
    try:
        CategoryRepository(db).ensure_defaults(DEFAULT_CATEGORIES)
    finally:
        db.close()

@app.get("/health")
def health():
    return {"ok": True, "ml_ready": MLService(settings.artifacts_dir).is_ready()}

@app.get("/categories", response_model=CategoryListOut, dependencies=[Depends(require_token)])
def get_categories(db: Session = Depends(get_db)):
    cats = CategoryRepository(db).list_all()
    return {"categories": cats}

@app.post("/categories", response_model=CategoryListOut, dependencies=[Depends(require_token)])
def add_category(payload: CategoryCreateIn, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Empty category name")
    CategoryRepository(db).add(name)
    return {"categories": CategoryRepository(db).list_all()}

@app.post("/upload", response_model=list[TransactionOut], dependencies=[Depends(require_token)])
def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    cleaner = CleaningService()
    df_raw = cleaner.load_csv(file.file)
    df = cleaner.normalize(df_raw)

    ml = MLService(settings.artifacts_dir)
    df_pred = ml.predict(df)

    tx_repo = TransactionRepository(db)
    rows = []
    for _, r in df_pred.iterrows():
        rows.append(TransactionRecord(
            source="upload",
            txn_date=None if pd.isna(r["txn_date"]) else r["txn_date"],
            description=str(r["description"]),
            amount=float(r["amount"]),
            predicted_category=str(r.get("predicted_category")) if r.get("predicted_category") is not None else None,
            final_category=None,
            confidence=float(r.get("confidence")) if r.get("confidence") is not None else None,
        ))
    saved = tx_repo.add_many(rows)
    return saved

@app.get("/transactions", response_model=list[TransactionOut], dependencies=[Depends(require_token)])
def list_transactions(db: Session = Depends(get_db)):
    return TransactionRepository(db).list_all()

@app.post("/feedback", response_model=TransactionOut, dependencies=[Depends(require_token)])
def feedback(payload: FeedbackIn, db: Session = Depends(get_db)):
    svc = FeedbackService(db)
    txn = svc.apply_feedback(payload.transaction_id, payload.new_category)
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@app.post("/retrain", response_model=RetrainOut, dependencies=[Depends(require_token)])
def retrain(db: Session = Depends(get_db)):
    """
    Runs machine_learning/retrain_model.py to incorporate feedback into the ML model.
    """
    proj_root = Path(__file__).resolve().parents[2]  # <-- THIS is ExpenseAI (project root)

    cmd = [sys.executable, "-m", "machine_learning.retrain_model"]

    result = subprocess.run(
        cmd,
        cwd=str(proj_root),          # run from ExpenseAI so machine_learning is importable
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"Retrain failed:\nSTDERR:\n{result.stderr[:2000]}\nSTDOUT:\n{result.stdout[:2000]}",
        )

    base_rows = 0
    corr_rows = 0
    for line in result.stdout.splitlines():
        if line.lower().startswith("base clean rows:"):
            base_rows = int(line.split(":")[1].strip())
        if line.lower().startswith("corrections rows:"):
            corr_rows = int(line.split(":")[1].strip())

    return RetrainOut(
        base_rows=base_rows,
        corrections_rows=corr_rows,
        artifacts_dir=settings.artifacts_dir,
    )


@app.get("/export", dependencies=[Depends(require_token)])
def export_csv(db: Session = Depends(get_db)):
    txns = TransactionRepository(db).list_all()
    df = ExportService().to_dataframe(txns)

    # If final_category exists use it, else predicted
    df["category"] = df["final_category"].fillna(df["predicted_category"])
    out = df[["txn_date", "description", "amount", "category", "predicted_category", "final_category", "confidence"]]

    buf = io.StringIO()
    out.to_csv(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenseai_export.csv"},
    )
