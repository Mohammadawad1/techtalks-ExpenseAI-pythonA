import re

def clean_text(text: str) -> str:
    """
    Basic text normalization:
    - convert to lowercase
    - remove special characters
    - remove extra spaces
    """
    if not isinstance(text, str):
        return ""


    text = text.lower()

    text = re.sub(r"\d+", "", text)

    
    text = re.sub(r"[^a-z0-9 ]+", " ", text)

    
    text = re.sub(r"\s+", " ", text).strip()

    return text


if __name__ == "__main__":
    samples = [
        "ATM Withdrawal - BEIRUT!",
        "Payment*** to Uber 123",
        "  Grocery   STORE -- Hamra  "
    ]

    for s in samples:
        print("Before:", s)
        print("After :", clean_text(s))
        print("-" * 40)
