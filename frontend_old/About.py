import streamlit as st

st.title("📗 About Expense AI")
st.subheader("""Welcome to Expense AI, We are the developers of this project.""")
# col1,col2=st.columns(2,border=True,width="stretch")
# with col1:
st.markdown("""Expense AI is an innovative application designed to help users manage and track their expenses effortlessly. By leveraging advanced AI technologies, Expense AI provides intelligent insights and personalized recommendations to optimize your financial habits. Whether you're looking to budget better, save more, or simply keep an eye on your spending, Expense AI is here to assist you every step of the way. Our mission is to empower individuals to take control of their finances with ease and confidence. 💡💰""")
# with col2:
image_url ="https://assets.seobotai.com/cdn-cgi/image/quality=75,w=1536,h=1024/lucid.now/68116f8092ebe69020266505-1745981658071.jpg"
st.image(image_url,caption="ExpenseAI - Smart Expense Management",width=600,clamp=True)