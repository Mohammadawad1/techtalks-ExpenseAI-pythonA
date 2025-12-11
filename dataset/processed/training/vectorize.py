import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle
import os

# Paths for datasets and saved files
X_TRAIN_PATH = "dataset/processed/X_train.csv"
X_TEST_PATH = "dataset/processed/X_test.csv"

X_TRAIN_VEC_PATH = "dataset/processed/X_train_vec.pkl"
X_TEST_VEC_PATH = "dataset/processed/X_test_vec.pkl"
TFIDF_PATH = "machine_learning/artifacts/tfidf.pkl"

# Create directories if they don't exist
os.makedirs(os.path.dirname(X_TRAIN_VEC_PATH), exist_ok=True)
os.makedirs(os.path.dirname(X_TEST_VEC_PATH), exist_ok=True)
os.makedirs(os.path.dirname(TFIDF_PATH), exist_ok=True)

print("Loading datasets...")
X_train = pd.read_csv(X_TRAIN_PATH)
X_test = pd.read_csv(X_TEST_PATH)

# Convert description column to strings
X_train_text = X_train["description"].fillna("").astype(str).tolist()
X_test_text = X_test["description"].fillna("").astype(str).tolist()

print("Initializing TF-IDF Vectorizer...")
tfidf = TfidfVectorizer(max_features=5000)

print("Fitting TF-IDF on training data...")
tfidf.fit(X_train_text)

print("Transforming datasets...")
X_train_vec = tfidf.transform(X_train_text)
X_test_vec = tfidf.transform(X_test_text)

print("Saving vectorized data...")
with open(X_TRAIN_VEC_PATH, "wb") as f:
    pickle.dump(X_train_vec, f)
with open(X_TEST_VEC_PATH, "wb") as f:
    pickle.dump(X_test_vec, f)

print("Saving TF-IDF model...")
with open(TFIDF_PATH, "wb") as f:
    pickle.dump(tfidf, f)

print("TF-IDF vectorization completed successfully!")
