import pandas as pd
import os

from text_cleaning import clean_text

INPUT_PATH_TRAIN = "dataset/processed/train2.csv"
INPUT_PATH_TEST = "dataset/processed/test2.csv"
OUTPUT_DIR = "dataset/processed/"

def prepare_data():
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ===== LOAD TRAIN =====
    df_train = pd.read_csv(INPUT_PATH_TRAIN)
    df_train["description"] = df_train["description"].apply(clean_text)

    X_train = df_train["description"]
    y_train = df_train["category"]

    # ===== LOAD TEST =====
    df_test = pd.read_csv(INPUT_PATH_TEST)
    df_test["description"] = df_test["description"].apply(clean_text)

    X_test = df_test["description"]
    y_test = df_test["category"]

    # ===== SAVE FILES =====
    X_train.to_csv(os.path.join(OUTPUT_DIR, "X_train.csv"), index=False)
    X_test.to_csv(os.path.join(OUTPUT_DIR, "X_test.csv"), index=False)
    y_train.to_csv(os.path.join(OUTPUT_DIR, "y_train.csv"), index=False)
    y_test.to_csv(os.path.join(OUTPUT_DIR, "y_test.csv"), index=False)

    print("✔ Data prepared and files successfully saved!")


if __name__ == "__main__":
    prepare_data()


    