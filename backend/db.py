# save_as: db.py
import os
import logging
from typing import Optional, List, Tuple

import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import connection as PGConnection, cursor as PGCursor
import pandas as pd
from dotenv import load_dotenv
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")
# Load environment variables from .env
load_dotenv()

# Basic logging configuration
logging.basicConfig(
    level=logging.INFO,  # You can change to DEBUG while developing
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def get_connection() -> PGConnection:
    """
    Create and return a PostgreSQL database connection using environment variables.

    Expected environment variables:
    - DB_NAME (default: "expenseai")
    - DB_USER (default: "postgres")
    - DB_PASSWORD
    - DB_HOST (default: "localhost")
    - DB_PORT (default: "5432")
    """
    try:
        conn: PGConnection = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "expenseai"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
        )
        logging.info("Database connection established successfully.")
        return conn
    except Exception:
        logging.error("Error connecting to the database.", exc_info=True)
        # Re-raise so the caller knows the connection failed
        raise


def insert_transactions_dataframe(df: pd.DataFrame, user_id: int) -> None:
    """
    Insert CSV transaction data into the 'transactions' table in PostgreSQL.

    Assumptions about the DataFrame `df`:
    - Contains columns: 'date', 'description', 'amount'
    - Optionally contains columns: 'raw_category', 'category'

    :param df: Pandas DataFrame with transaction data.
    :param user_id: ID of the user to associate these transactions with.
    """
    conn: Optional[PGConnection] = None
    cur: Optional[PGCursor] = None

    try:
        conn = get_connection()
        cur = conn.cursor()

        rows: List[Tuple] = []
        for _, row in df.iterrows():
            rows.append(
                (
                    user_id,
                    row["date"],                      # Expected format: 'YYYY-MM-DD'
                    row["description"],
                    float(row["amount"]),
                    row.get("raw_category", None),    # model-predicted category (can be None)
                    row.get("category", None),        # final_category
                )
            )

        logging.info(
            "Preparing to insert %d transactions for user_id=%s.",
            len(rows),
            user_id,
        )

        execute_values(
            cur,
            """
            INSERT INTO transactions (
                user_id, date, description, amount, raw_category, final_category
            ) VALUES %s
            """,
            rows,
        )

        conn.commit()
        logging.info(
            "Successfully inserted %d transactions for user_id=%s.",
            len(rows),
            user_id,
        )

    except Exception:
        if conn is not None:
            conn.rollback()
        logging.error(
            "Failed to insert transactions for user_id=%s. Rolling back.",
            user_id,
            exc_info=True,
        )
        # Re-raise to let the caller handle the error if needed
        raise
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
        logging.info("Database connection closed after insert_transactions_dataframe.")
