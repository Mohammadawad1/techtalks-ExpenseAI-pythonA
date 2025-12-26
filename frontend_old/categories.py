import streamlit as st
import requests  
import pandas as pd

API_URL = st.secrets.get("API_URL", "http://127.0.0.1:8000")
API_TOKEN = st.secrets.get("API_TOKEN", "dev-token")
HEADERS = {"X-API-Token": API_TOKEN}

# 🟢 1) Load categories from backend
cats_resp = requests.get(f"{API_URL}/categories", headers=HEADERS)
if cats_resp.status_code != 200:
    st.error(cats_resp.text)
    st.stop()

CATEGORIES = cats_resp.json()["categories"]

st.write("### 📖 Valid Categories Reference")
st.caption("Use these exact names if you need to fix a category in the table below:")

badge_markdown = " ".join([f":green-badge[{cat}]" for cat in CATEGORIES])
st.markdown(badge_markdown)

# 🟢 2) Load transactions from backend (بدل from uploadcsv import df)
tx_resp = requests.get(f"{API_URL}/transactions", headers=HEADERS)
if tx_resp.status_code != 200:
    st.error(tx_resp.text)
    st.stop()

data = tx_resp.json()
if not data:
    st.info("No transactions yet. Upload a CSV to start.")
    st.stop()

df = pd.DataFrame(data)

# 🟢 3) تأمين الأعمدة المطلوبة لو مش موجودة
if "final_category" not in df.columns:
    df["final_category"] = None

if "predicted_category" not in df.columns:
    # بعض الـ APIs ترجع raw_category بدل predicted_category
    if "raw_category" in df.columns:
        df["predicted_category"] = df["raw_category"]
    else:
        df["predicted_category"] = None

if "confidence" not in df.columns:
    df["confidence"] = None

# 🟢 4) عمود category_suggested = final أو predicted
df["category_suggested"] = df["final_category"].fillna(df["predicted_category"])

st.write("Transactions (edit category and submit):")

# نبني View للعرض والتحرير
needed_cols = ["id", "txn_date", "description", "amount",
               "predicted_category", "final_category", "confidence"]

# تأمين الأعمدة لو ناقص واحد منهم
for col in needed_cols:
    if col not in df.columns:
        df[col] = None

view = df[needed_cols].copy()
view["new_category"] = df["category_suggested"]

edited = st.data_editor(
    view,
    use_container_width=True,
    num_rows="dynamic",
    column_config={
        "id": st.column_config.NumberColumn("id", disabled=True),
        "txn_date": st.column_config.TextColumn("txn_date", disabled=True),
        "description": st.column_config.TextColumn("description", disabled=True),
        "amount": st.column_config.NumberColumn("amount", disabled=True),
        "predicted_category": st.column_config.TextColumn("predicted_category", disabled=True),
        "final_category": st.column_config.TextColumn("final_category", disabled=True),
        # 🟢 هنا المستخدم يغيّر الكاتيغوري
        "new_category": st.column_config.SelectboxColumn("new_category", options=CATEGORIES, disabled=False),
        "confidence": st.column_config.NumberColumn("confidence", disabled=True),
    }
)

st.session_state["my_view_data"] = view

if st.button("Submit corrections"):
    # نحدّد الصفوف اللي تغيّر فيها الـ new_category
    changed = edited[edited["new_category"] != df["category_suggested"]]

    if changed.empty:
        st.info("No changes detected.")
    else:
        ok = 0
        for _, row in changed.iterrows():
            payload = {
                "transaction_id": int(row["id"]),
                "new_category": row["new_category"],
            }
            rr = requests.post(f"{API_URL}/feedback", headers=HEADERS, json=payload)
            if rr.status_code == 200:
                ok += 1
        st.success(f"Submitted {ok} corrections.")

        # إعادة تحميل البيانات بعد التصحيح
        r = requests.get(f"{API_URL}/transactions", headers=HEADERS)
        r.raise_for_status()
        df = pd.DataFrame(r.json())
        if "final_category" not in df.columns:
            df["final_category"] = None
        if "predicted_category" not in df.columns:
            if "raw_category" in df.columns:
                df["predicted_category"] = df["raw_category"]
            else:
                df["predicted_category"] = None
        df["category_suggested"] = df["final_category"].fillna(df["predicted_category"])

    st.divider()
    st.subheader("Export categorized CSV")
    if st.button("Download export"):
        rr = requests.get(f"{API_URL}/export", headers=HEADERS)
        rr.raise_for_status()
        st.download_button(
            "Click to download",
            data=rr.content,
            file_name="expenseai_export.csv",
            mime="text/csv",
        )
