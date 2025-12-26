import streamlit as st
import requests
import pandas as pd

API_URL = st.secrets.get("API_URL", "http://127.0.0.1:8000")
API_TOKEN = st.secrets.get("API_TOKEN", "dev-token")

HEADERS = {"X-API-Token": API_TOKEN}

st.subheader("Upload your bank CSV")

df = pd.DataFrame()

uploaded = st.file_uploader("Upload CSV", type=["csv"])

if uploaded is not None:
    
    files = {"file": (uploaded.name, uploaded.getvalue(), "text/csv")}
    r = requests.post(f"{API_URL}/upload", headers=HEADERS, files=files)

    if r.status_code != 200:
        st.error(r.text)
    else:
        result = r.json()
        st.success(f"Uploaded and categorized {len(result)} transactions.")

        st.subheader("Review & correct categories (learning feedback loop)")
        r2 = requests.get(f"{API_URL}/transactions", headers=HEADERS)
        if r2.status_code == 200:
            data = r2.json()
            df = pd.DataFrame(data)
        else:
            st.error(r2.text)


if df.empty:
    st.info("No transactions yet. Upload a CSV to start.")
else:
    st.dataframe(df)
