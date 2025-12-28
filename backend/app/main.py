from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import pandas as pd
import subprocess
import sys
from pathlib import Path

from .core.config import settings
from .db.database import Base, engine, get_db
from .db.repository import TransactionRepository, CategoryRepository, UserRepository
from .schemas.dtos import (
    TransactionOut, CategoryListOut, CategoryCreateIn, TransactionCreateIn, TransactionUpdateIn, FeedbackIn, BulkFeedbackIn, RetrainOut,
    UserCreate, UserOut, Token, UserLogin
)
from .services.cleaning_service import CleaningService
from .services.ml_service import MLService
from .services.feedback_service import FeedbackService
from .services.category_service import DEFAULT_CATEGORIES
from .services.export_service import ExportService
from .core.auth_utils import create_access_token, get_password_hash, verify_password, get_current_user
from .db.models import TransactionRecord, User as UserModel

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ExpenseAI API")

# Production-ready Dynamic CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    if settings.env == "development":
        print(f"DEBUG: Incoming {request.method} request to {request.url.path}")
    
    response = await call_next(request)
    
    if settings.env == "development":
        print(f"DEBUG: Response status: {response.status_code}")
    return response

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

@app.get("/categories", response_model=CategoryListOut)
def get_categories(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    cats = CategoryRepository(db).list_all()
    return {"categories": cats}

@app.post("/categories", response_model=CategoryListOut)
def add_category(payload: CategoryCreateIn, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Empty category name")
    CategoryRepository(db).add(name)
    return {"categories": CategoryRepository(db).list_all()}

@app.post("/upload", response_model=list[TransactionOut])
def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    print(f"DEBUG: Starting upload for user {current_user.email}, file: {file.filename}")
    try:
        cleaner = CleaningService()
        df_raw = cleaner.load_csv(file.file)
        print(f"DEBUG: Loaded CSV with {len(df_raw)} raw rows")
        
        df = cleaner.normalize(df_raw)
        print(f"DEBUG: Normalized to {len(df)} rows")

        ml = MLService(settings.artifacts_dir, user_id=current_user.id)
        df_pred = ml.predict(df)
        print(f"DEBUG: Prediction complete")

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
                user_id=current_user.id
            ))
        saved = tx_repo.add_many(rows)
        print(f"DEBUG: Saved {len(saved)} transactions to database")
        return saved
    except Exception as e:
        print(f"ERROR: Upload failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/transactions", response_model=TransactionOut)
async def create_transaction(
    payload: TransactionCreateIn, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    predicted = None
    if payload.category:
        # Validate provided category
        cats = CategoryRepository(db).list_all()
        if payload.category not in cats:
            raise HTTPException(status_code=400, detail=f"Category '{payload.category}' does not exist")
    else:
        # Initial placeholder prediction
        predicted = {"predicted_category": "Predicting...", "confidence": 0.0}
    
    txn = TransactionRepository(db).add_manual(payload, current_user.id, predicted=predicted)
    
    # If no category, run prediction in background
    if not payload.category:
        background_tasks.add_task(
            predict_and_update_manual_txn,
            txn.id,
            payload.description,
            payload.amount,
            current_user.id
        )
    
    return txn

def predict_and_update_manual_txn(txn_id: int, description: str, amount: float, user_id: int):
    """
    Background task to run ML prediction and update the transaction.
    """
    from .db.database import SessionLocal
    db = SessionLocal()
    try:
        # Load artifacts and predict
        ml = MLService(settings.artifacts_dir, user_id=user_id)
        df_temp = pd.DataFrame([{"description": description, "amount": amount}])
        df_pred = ml.predict(df_temp)
        pred = df_pred.iloc[0]
        
        # Update record
        TransactionRepository(db).update_prediction(
            txn_id, 
            str(pred["predicted_category"]), 
            float(pred["confidence"])
        )
    finally:
        db.close()

@app.get("/transactions", response_model=list[TransactionOut])
def list_transactions(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return TransactionRepository(db).list_all(current_user.id)

@app.delete("/transactions")
def delete_transactions(payload: list[int], db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    TransactionRepository(db).delete_transactions(payload, current_user.id)
    return {"status": "success", "deleted_count": len(payload)}

@app.put("/transactions/{txn_id}", response_model=TransactionOut)
def update_transaction(txn_id: int, payload: TransactionUpdateIn, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    txn = TransactionRepository(db).update(txn_id, payload, current_user.id)
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@app.post("/feedback")
def feedback(payload: FeedbackIn, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    svc = FeedbackService(db)
    txn = svc.apply_feedback(payload.transaction_id, payload.new_category, current_user.id)
    if txn is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@app.post("/feedback/apply", response_model=list[TransactionOut])
def bulk_feedback(payload: BulkFeedbackIn, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    svc = FeedbackService(db)
    return svc.bulk_apply_feedback(payload.updates, current_user.id)

@app.post("/retrain", response_model=RetrainOut)
def retrain(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Runs machine_learning/retrain_model.py to incorporate feedback into the ML model.
    """
    proj_root = Path(__file__).resolve().parents[2]  # <-- THIS is ExpenseAI (project root)

    cmd = [sys.executable, "-m", "machine_learning.retrain_model", "--user-id", str(current_user.id)]

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


@app.get("/export")
def export_csv(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    txns = TransactionRepository(db).list_all(current_user.id)
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

@app.get("/exports/categories")
def export_categories(
    scope: str = "all",
    from_val: str = Query(None, alias="from"),
    to_val: str = Query(None, alias="to"),
    search: str = "",
    category: str = "",
    show_unreviewed: bool = False,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Export transactions with scope filtering:
    - scope=all: All transactions
    - scope=latest: Only the most recent upload batch
    - scope=range: Filter by date range (requires from_date and to_date)
    - date_field: 'txn_date' (transaction date) or 'created_at' (upload date)
    - search: Filter by description text
    - category: Filter by specific category
    - show_unreviewed: Show only unreviewed transactions
    """
    from datetime import datetime
    from sqlalchemy import desc
    
    tx_repo = TransactionRepository(db)
    txns = tx_repo.list_all(current_user.id)
    
    # Apply scope filtering
    if scope == "latest":
        # Find the latest created_at timestamp
        if txns:
            latest_time = max(t.created_at for t in txns)
            # Filter transactions created within 1 second of the latest (same batch)
            txns = [t for t in txns if abs((t.created_at - latest_time).total_seconds()) < 1]
    
    elif scope == "range":
        if from_val:
            # Parse date string (YYYY-MM-DD format)
            from_dt = datetime.strptime(from_val, '%Y-%m-%d').date()
            # Filter by transaction date
            txns = [t for t in txns if t.txn_date and t.txn_date >= from_dt]
        
        if to_val:
            # Parse date string (YYYY-MM-DD format)
            to_dt = datetime.strptime(to_val, '%Y-%m-%d').date()
            # Filter by transaction date
            txns = [t for t in txns if t.txn_date and t.txn_date <= to_dt]
    
    # Apply additional filters (matching UI behavior)
    if search:
        txns = [t for t in txns if search.lower() in t.description.lower()]
    
    if category:
        txns = [t for t in txns if (t.final_category or t.predicted_category) == category]
    
    if show_unreviewed:
        txns = [t for t in txns if not t.final_category]
    
    # Convert to DataFrame and export
    df = ExportService().to_dataframe(txns)
    
    if len(df) == 0:
        # Return empty CSV with headers
        df = pd.DataFrame(columns=["date", "description", "amount", "predicted_category", "final_category", "confidence"])
    else:
        # Rename txn_date to date
        df = df.rename(columns={"txn_date": "date"})
        # Select only required columns (excluding 'category')
        df = df[["date", "description", "amount", "predicted_category", "final_category", "confidence"]]
    
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    
    filename = f"transactions_{scope}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

# --- Auth Endpoints ---

@app.post("/auth/signup", response_model=UserOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_email(payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = UserModel(
        email=payload.email,
        hashed_password=get_password_hash(payload.password)
    )
    return repo.create(new_user)

@app.post("/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = UserRepository(db).get_by_email(payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
