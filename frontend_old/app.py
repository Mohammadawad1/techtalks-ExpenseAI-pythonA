import streamlit as st
import requests
import pandas as pd

API_URL = st.secrets.get("API_URL", "http://127.0.0.1:8000")
API_TOKEN = st.secrets.get("API_TOKEN", "dev-token")

HEADERS = {"X-API-Token": API_TOKEN}

with st.sidebar:
    st.header("Actions")
    refresh = st.button("Refresh transactions")
    retrain = st.button("Retrain model from feedback")
    st.caption("Token is sent via X-API-Token header (MVP).")

if retrain:
    r = requests.post(f"{API_URL}/retrain", headers=HEADERS)
    if r.status_code != 200:
        st.error(r.text)
    else:
        st.success(f"Retrained. Base rows={r.json()['base_rows']} | corrections={r.json()['corrections_rows']}")
        refresh = True

pages={
    "Main":[
        st.Page("uploadcsv.py",title="Upload CSV",icon="📁"),
        st.Page("categories.py",title="Review Categories",icon="ℹ️"),
        st.Page("chart.py",title="Spending Dashboard",icon="📊")
    ],
    "Support":[
        st.Page("informations.py",title="Contact Us",icon="☎️")
    ],
    "About us":[
        st.Page("about.py",title="About ExpenseAI",icon="❓")
    ]
}

page = st.navigation(pages,
    position="sidebar"
)
page.run()
