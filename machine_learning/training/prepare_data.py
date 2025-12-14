import os
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from text_cleaning import clean_text

INPUT_PATH_TRAIN = "dataset/processed/train2.csv"
INPUT_PATH_TEST  = "dataset/processed/test2.csv"
OUTPUT_DIR = "dataset/processed/"

TEST_SIZE = 0.2
RANDOM_STATE = 42


def prepare_data():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ===== LOAD TRAIN + TEST =====
    df_train = pd.read_csv(INPUT_PATH_TRAIN)
    df_test  = pd.read_csv(INPUT_PATH_TEST)

    # ===== MERGE =====
    df = pd.concat([df_train, df_test], ignore_index=True)

    # ===== BASIC CLEANING =====
    df = df.dropna(subset=["description", "category"])
    df["description"] = (
        df["description"]
        .astype(str)
        .apply(clean_text)
        .str.strip()
    )
    df["category"] = df["category"].astype(str).str.strip()

    # شيل الوصف الفارغ
    df = df[df["description"] != ""]

    # ===== GROUP SPLIT (NO OVERLAP BY DESCRIPTION) =====
    gss = GroupShuffleSplit(
        n_splits=1,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE
    )
    train_idx, test_idx = next(
        gss.split(df, df["category"], groups=df["description"])
    )

    df_train_clean = df.iloc[train_idx].copy()
    df_test_clean  = df.iloc[test_idx].copy()

    # ===== VERIFY =====
    overlap = set(df_train_clean["description"]) & set(df_test_clean["description"])
    print("Overlap after split:", len(overlap))  # لازم 0

    # ===== SAVE FILES (نفس الأسماء اللي مشروعك يستخدمها) =====
    df_train_clean["description"].to_csv(
        os.path.join(OUTPUT_DIR, "X_train.csv"),
        index=False
    )
    df_test_clean["description"].to_csv(
        os.path.join(OUTPUT_DIR, "X_test.csv"),
        index=False
    )
    df_train_clean["category"].to_csv(
        os.path.join(OUTPUT_DIR, "y_train.csv"),
        index=False
    )
    df_test_clean["category"].to_csv(
        os.path.join(OUTPUT_DIR, "y_test.csv"),
        index=False
    )

    # نسخ كاملة clean (للتدقيق والتقرير)
    df_train_clean.to_csv(
        os.path.join(OUTPUT_DIR, "train_clean.csv"),
        index=False
    )
    df_test_clean.to_csv(
        os.path.join(OUTPUT_DIR, "test_clean.csv"),
        index=False
    )

    print("✔ Data prepared and files successfully saved!")


if __name__ == "__main__":
    prepare_data()
