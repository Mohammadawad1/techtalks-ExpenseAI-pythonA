
import os
import sys
# Add project root to path to allow importing machine_learning module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from flask import Flask, request, jsonify, send_file
import pandas as pd
from db import insert_transactions_dataframe
from machine_learning.model_loader import predict_df
import io
import uuid
from datetime import datetime, timezone, timedelta
from db import get_connection
EXPORTS = {}  # download_id -> {"bytes": b"...", "filename": "...", "created_at": datetime}
EXPORT_TTL_MIN = 30  # 
VALID_CATEGORIES = {
    "transportation",
    "food_&_dining",
    "shopping",
    "bills_&_utilities",
    "entertainment",
    "education",
    "health_&_medical",
    "income_&_transfers",
    "other"
}



def cleanup_exports():
    now = datetime.now(timezone.utc)
    expired = []

    for k, v in EXPORTS.items():
        created_at = v.get("created_at")

        # Normalize old entries (naive -> assume UTC)
        if isinstance(created_at, datetime) and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
            v["created_at"] = created_at  # optional: store back

        if now - created_at > timedelta(minutes=EXPORT_TTL_MIN):
            expired.append(k)

    for k in expired:
        EXPORTS.pop(k, None)

app = Flask(__name__)


@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Endpoint to receive, validate, categorize, and save CSV file uploads
    """
    try:
        # Validation 1: Check that a file is included in the request
        if 'file' not in request.files:
            return jsonify({
                'ok': False,
                'error': 'no_file_part',
                'details': 'No file part in the request. Please include a file.'
            }), 400
        
        file = request.files['file']
        
        # Check if filename is empty (no file selected)
        if file.filename == '':
            return jsonify({
                'ok': False,
                'error': 'no_selected_file',
                'details': 'No selected file'
            }), 400
        
        # Validation 2: Check that the file has a .csv extension
        if not file.filename.lower().endswith('.csv'):
            return jsonify({
                'ok': False,
                'error': 'invalid_file_type',
                'details': 'Invalid file type. Only CSV files are allowed.'
            }), 400
        
        # Validation 3: Check that the file is not empty and has actual data
        try:
            # Reset file pointer to read CSV
            file.seek(0)
            # Try to read CSV
            df = pd.read_csv(file)
            if df.empty:
                return jsonify({
                    'ok': False,
                    'error': 'empty_file',
                    'details': 'The uploaded file is empty.'
                }), 400
                
            # EA-36: Validate column description exists
            if 'description' not in df.columns:
                return jsonify({
                    "ok": False, 
                    "error": "missing_required_column", 
                    "details": "Column 'description' is required"
                }), 400
                
        except Exception as csv_error:
            return jsonify({
                'ok': False,
                'error': 'csv_parse_error',
                'details': f'Invalid CSV file. Could not parse CSV: {str(csv_error)}'
            }), 400
        
        # Clean text column
        df["description"] = df["description"].fillna("").astype(str).str.strip()
        
        # Run batch inference
        try:
            # predict_df returns the dataframe with 'predicted_category' column
            df = predict_df(df, text_col="description")
        except Exception as ml_error:
            return jsonify({
                'ok': False,
                'error': 'inference_failed',
                'details': f'ML inference failed: {str(ml_error)}'
            }), 500

        # Persist to Database
        try:
            user_id = int(os.environ.get('DEMO_USER_ID', 1))

            df_db = df.copy()
            if 'predicted_category' in df_db.columns:
                df_db['raw_category'] = df_db['predicted_category']

            insert_transactions_dataframe(df_db, user_id=user_id)

        except Exception as db_error:
            return jsonify({
                "ok": False,
                "error": "db_insert_failed",
                "details": str(db_error)
            }), 500
        
        # Return Categorized Data
        # --- Build preview (lightweight) ---
        df_for_client = df.drop(columns=["raw_category"], errors="ignore")
        preview = df_for_client.to_dict(orient="records")

        cleanup_exports()
        download_id = str(uuid.uuid4())

        csv_bytes = df_for_client.to_csv(index=False, float_format="%.2f").encode("utf-8")

        
        original_name = os.path.splitext(file.filename)[0]
        export_filename = f"{original_name}_categorized.csv"

        EXPORTS[download_id] = {
        "bytes": csv_bytes,
        "filename": export_filename,
        "created_at": datetime.now(timezone.utc),
        }

        return jsonify({
        "ok": True,
        "rows": len(df_for_client),
        "preview": preview,
        "columns": df_for_client.columns.tolist(),
        "download_id": download_id,
        "download_url": f"/download/{download_id}"
    }), 200


    except Exception as e:
        # Server-side error
        return jsonify({
            'ok': False,
            'error': 'unexpected_error',
            'details': f'An unexpected error occurred: {str(e)}'
        }), 500

@app.route("/download/<download_id>", methods=["GET"])
def download_csv(download_id):
    item = EXPORTS.get(download_id)
    if not item:
        return jsonify({
            "ok": False,
            "error": "download_not_found",
            "details": "Download link expired or invalid."
        }), 404

    buf = io.BytesIO(item["bytes"])
    buf.seek(0)

    return send_file(
        buf,
        mimetype="text/csv",
        as_attachment=True,
        download_name=item["filename"]  # Flask 2.x
    )

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'API is running'
    }), 200

@app.route("/update-final-category", methods=["POST"])
def update_final_category():
    try:
        payload = request.get_json(silent=True) or {}

        transaction_id = payload.get("transaction_id")
        final_category = payload.get("final_category")

        if not transaction_id or not final_category:
            return jsonify({
                "ok": False,
                "error": "missing_fields",
                "details": "transaction_id and final_category are required"
            }), 400
        if final_category not in VALID_CATEGORIES:
            return jsonify({
                "ok": False,
                "error": "invalid_category",
                "details": f"'{final_category}' is not a valid category"
            }), 400

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE transactions
                    SET final_category = %s
                    WHERE transaction_id = %s
                    """,
                    (final_category, transaction_id)
                )
            conn.commit()
        finally:
            conn.close()

        return jsonify({"ok": True}), 200

    except Exception as e:
        return jsonify({
            "ok": False,
            "error": "update_failed",
            "details": str(e)
        }), 500
    
@app.route("/transactions", methods=["GET"])
def get_transactions():
    try:
        limit = int(request.args.get("limit", 200))
        user_id = int(request.args.get("user_id", os.environ.get("DEMO_USER_ID", 1)))

        # حماية بسيطة
        limit = max(1, min(limit, 2000))

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        transaction_id,
                        description,
                        raw_category,
                        final_category,
                        amount,
                        created_at
                    FROM transactions
                    WHERE user_id = %s
                    ORDER BY transaction_id DESC
                    LIMIT %s
                    """,
                    (user_id, limit)
                )

                rows = cur.fetchall()

            
            data = []
            for r in rows:
                data.append({
                    "transaction_id": r[0],
                    "description": r[1],
                    "raw_category": r[2],
                    "final_category": r[3],
                    "amount": r[4],
                    "created_at": r[5].isoformat() if r[5] else None
                })

        finally:
            conn.close()

        return jsonify({
            "ok": True,
            "rows": len(data),
            "data": data
        }), 200

    except Exception as e:
        return jsonify({
            "ok": False,
            "error": "fetch_failed",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    # Port can be changed via environment variable, defaults to 5000
    port = int(os.environ.get('PORT', 5000))
    # Note: The warning about development server is expected and normal for local development
    # For production, use a WSGI server like gunicorn, waitress, or uwsgi
    app.run(debug=True, port=port)

