import streamlit as st
import requests 
import pandas as pd

API_URL = st.secrets.get("API_URL", "http://127.0.0.1:8000")
API_TOKEN = st.secrets.get("API_TOKEN", "dev-token")
HEADERS = {"X-API-Token": API_TOKEN}

st.subheader("Spending Dashboard")

# 1) حمّل الترانزاكشنز من الـ backend
resp = requests.get(f"{API_URL}/transactions", headers=HEADERS)
if resp.status_code != 200:
    st.error(resp.text)
    st.stop()

data = resp.json()
if not data:
    st.info("No transactions yet. Upload a CSV to start.")
    st.stop()

df = pd.DataFrame(data)

# 2) تأمين الأعمدة اللي منحتاجها
if "final_category" not in df.columns:
    df["final_category"] = None

if "predicted_category" not in df.columns:
    if "raw_category" in df.columns:
        df["predicted_category"] = df["raw_category"]
    else:
        df["predicted_category"] = None

if "amount" not in df.columns:
    st.error("Backend response has no 'amount' field. Cannot build dashboard.")
    st.dataframe(df.head())
    st.stop()

# 3) عمود category_suggested = final أو predicted
df["category_suggested"] = df["final_category"].fillna(df["predicted_category"])

# 4) تحضير بيانات الصرف
tmp = df.copy()
tmp["category"] = tmp["category_suggested"]
tmp["amount"] = pd.to_numeric(tmp["amount"], errors="coerce").fillna(0.0)

# نفترض positive = spending, negative = income
spending = (
    tmp[tmp["amount"] > 0]
    .groupby("category")["amount"]
    .sum()
    .sort_values(ascending=False)
)

if spending.empty:
    st.info("No positive spending amounts to chart yet.")
else:
    st.write("Spending by category")
    st.bar_chart(spending)

    with st.expander("Top categories"):
        st.dataframe(
            spending.head(10).reset_index().rename(columns={"amount": "total_spent"}),
            use_container_width=True,
        )

# 5) جزء الفلترة بالتاريخ بناءً على بيانات الـ Categories (لو موجودة)
if "my_view_data" in st.session_state:
    view = st.session_state["my_view_data"].copy()

    # تأكد أن txn_date موجود وقابل للتحويل
    if "txn_date" in view.columns:
        view["txn_date"] = pd.to_datetime(view["txn_date"], errors="coerce")

        with st.expander("💰 Expense Tracker filtered by date"):
            col1, col2 = st.columns(2)

            with col1:
                start_date = st.date_input("Start Date", view["txn_date"].min().date())
            with col2:
                end_date = st.date_input("End Date", view["txn_date"].max().date())

            filtered_df = view[
                (view["txn_date"].dt.date >= start_date)
                & (view["txn_date"].dt.date <= end_date)
            ]

            summary_df = (
                filtered_df.groupby("new_category")["amount"]
                .sum()
                .reset_index()
                .rename(columns={"amount": "Total Spent ($)"})
            )

            st.write(f"### Totals from {start_date} to {end_date}")

            if not summary_df.empty:
                st.dataframe(summary_df, use_container_width=True, hide_index=True)
                total_val = summary_df["Total Spent ($)"].sum()
                st.metric("Grand Total", f"${total_val:,.2f}")
            else:
                st.warning("No expenses found for this date range.")
else:
    st.info("Please submit and review categories first in the Categories tab!")
