import streamlit as st

st.title("📞Contact Us")
st.write("""We’d love to hear from you! 💬
If you have any questions, suggestions, or feedback about Expense AI, feel free to reach out. Your thoughts help us make the experience even better. You can contact our team anytime through email or our support page on the website. We're here to assist you and ensure you get the most out of Expense AI. Thank you for being a valued user! 🙌""")

with st.expander("Email",icon="📧"):
    st.markdown("[expenseAI@gmail.com](#email-address)")
with st.expander("Phone number",icon="📱"):
    st.write("+961 70300300")
with st.expander("address",icon="🪧"):
    st.write("Beruit, Lebanon")