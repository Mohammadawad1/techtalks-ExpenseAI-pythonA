import io
import requests
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt

API_URL = st.secrets.get("API_URL", "http://127.0.0.1:8000")
API_TOKEN = st.secrets.get("API_TOKEN", "dev-token")

HEADERS = {"X-API-Token": API_TOKEN}

st.set_page_config(page_title="ExpenseAI", layout="wide")
st.title("ExpenseAI — Bank Transaction Categorization")

# Sidebar actions
with st.sidebar:
    st.header("Actions")
    refresh = st.button("Refresh transactions")
    retrain = st.button("Retrain model from feedback")
    st.caption("Token is sent via X-API-Token header (MVP).")

# Load categories
cats_resp = requests.get(f"{API_URL}/categories", headers=HEADERS)
cats_resp.raise_for_status()
CATEGORIES = cats_resp.json()["categories"]

# Upload CSV
st.subheader("1) Upload your bank CSV")
uploaded = st.file_uploader("Upload CSV", type=["csv"])
if uploaded is not None:
    files = {"file": (uploaded.name, uploaded.getvalue(), "text/csv")}
    r = requests.post(f"{API_URL}/upload", headers=HEADERS, files=files)
    if r.status_code != 200:
        st.error(r.text)
    else:
        st.success(f"Uploaded and categorized {len(r.json())} transactions.")
        refresh = True

# Retrain
if retrain:
    r = requests.post(f"{API_URL}/retrain", headers=HEADERS)
    if r.status_code != 200:
        st.error(r.text)
    else:
        st.success(f"Retrained. Base rows={r.json()['base_rows']} | corrections={r.json()['corrections_rows']}")
        refresh = True

# List transactions
st.subheader("2) Review & correct categories (learning feedback loop)")
if refresh or True:
    r = requests.get(f"{API_URL}/transactions", headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    df = pd.DataFrame(data)

if df.empty:
    st.info("No transactions yet. Upload a CSV to start.")
    st.stop()

# Display + editable corrections
df["category_suggested"] = df["final_category"].fillna(df["predicted_category"])
left, right = st.columns([2, 1], gap="large")

with left:
    st.write("Transactions (edit category and submit):")

    # Build an editable view
    view = df[["id", "txn_date", "description", "amount", "predicted_category", "final_category", "confidence"]].copy()
    view["new_category"] = df["category_suggested"]

    edited = st.data_editor(
        view,
        use_container_width=True,
        num_rows="dynamic",
        column_config={
            "new_category": st.column_config.SelectboxColumn("new_category", options=CATEGORIES),
        }
    )

    if st.button("Submit corrections"):
        changed = edited[edited["new_category"] != df["category_suggested"]]
        if changed.empty:
            st.info("No changes detected.")
        else:
            ok = 0
            for _, row in changed.iterrows():
                payload = {"transaction_id": int(row["id"]), "new_category": row["new_category"]}
                rr = requests.post(f"{API_URL}/feedback", headers=HEADERS, json=payload)
                if rr.status_code == 200:
                    ok += 1
            st.success(f"Submitted {ok} corrections.")
            # Reload
            r = requests.get(f"{API_URL}/transactions", headers=HEADERS)
            r.raise_for_status()
            df = pd.DataFrame(r.json())
            df["category_suggested"] = df["final_category"].fillna(df["predicted_category"])

    st.divider()
    st.subheader("3) Export categorized CSV")
    if st.button("Download export"):
        rr = requests.get(f"{API_URL}/export", headers=HEADERS)
        rr.raise_for_status()
        st.download_button(
            "Click to download",
            data=rr.content,
            file_name="expenseai_export.csv",
            mime="text/csv",
        )

with right:
    st.subheader("4) Spending Dashboard")
    tmp = df.copy()
    tmp["category"] = tmp["final_category"].fillna(tmp["predicted_category"])
    tmp["amount"] = pd.to_numeric(tmp["amount"], errors="coerce").fillna(0.0)

    # Assume positive = spending, negative = income
    spending = tmp[tmp["amount"] > 0].groupby("category")["amount"].sum().sort_values(ascending=False)

    if spending.empty:
        st.info("No positive spending amounts to chart yet.")
    else:
        st.write("Spending by category")
        fig = plt.figure()
        spending.plot(kind="bar")
        st.pyplot(fig, clear_figure=True)

        st.write("Top categories")
        st.dataframe(spending.head(10).reset_index().rename(columns={"amount": "total_spent"}), use_container_width=True)
