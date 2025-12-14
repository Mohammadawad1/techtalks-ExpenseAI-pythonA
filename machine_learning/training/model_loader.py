import pickle
import os

# Paths to trained artifacts
MODEL_PATH = "machine_learning/artifacts/expense_model.pkl"
TFIDF_PATH = "machine_learning/artifacts/tfidf.pkl"


def load_artifacts():
    """
    Load trained model and TF-IDF vectorizer.
    """
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    if not os.path.exists(TFIDF_PATH):
        raise FileNotFoundError(f"TF-IDF not found at {TFIDF_PATH}")

    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    with open(TFIDF_PATH, "rb") as f:
        tfidf = pickle.load(f)

    return model, tfidf


def predict(text: str) -> str:
    """
    Predict transaction category from input text.
    """
    if not isinstance(text, str):
        raise ValueError("Input text must be a string")

    model, tfidf = load_artifacts()

    # Transform input text using trained TF-IDF
    text_vec = tfidf.transform([text])

    # Predict category
    prediction = model.predict(text_vec)

    return prediction[0]


if __name__ == "__main__":
    # Simple manual test (will work once model files exist)
    sample_texts = [
        "carrefour grocery shopping",
        "electricity bill payment",
        "uber trip downtown",
        "salary monthly deposit",
        "pharmacy medication purchase"
    ]

    for text in sample_texts:
        try:
            category = predict(text)
            print(f"Text: {text} -> Predicted category: {category}")
            

        except Exception as e:
            print(f"Error predicting '{text}': {e}")
