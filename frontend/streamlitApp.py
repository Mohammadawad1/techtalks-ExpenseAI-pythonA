import streamlit as st
import pandas as pd
import requests

st.title("Welcome To Expense AI!🏦💰")

API_PORT = 5000 
API_URL = f"http://localhost:{API_PORT}/upload"

uploaded_file = st.file_uploader(
    "Upload your csv file here👇🏻", accept_multiple_files=False, type="csv"
)

if uploaded_file is not None:
    # Reset file pointer to beginning
    uploaded_file.seek(0)
    
    # Send file to Flask API for validation & processing
    with st.spinner("Processing & categorizing expenses..."):
        try:
            # Prepare file for upload
            files = {'file': (uploaded_file.name, uploaded_file, 'text/csv')}
            
            # Send POST request to Flask API
            response = requests.post(API_URL, files=files)
            
            # Handle Success (200 OK)
            if response.status_code == 200:
                data = response.json()
                
                if data.get("ok"):
                    st.success("✅ Categorization completed successfully")
                    
                    # Process results
                    preview_data = data.get("preview", [])
                    df_result = pd.DataFrame(preview_data)
                    
                    # Display metrics
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Rows Processed", data.get("rows", 0))
                    with col2:
                        st.metric("Columns", len(df_result.columns))
                    
                    # Display Data
                    st.subheader("Categorized Expenses")
                    st.dataframe(df_result)
                    
                    download_url = f"http://localhost:{API_PORT}" + data["download_url"]

                    dl_resp = requests.get(download_url)
                    if dl_resp.status_code != 200:
                        st.error(f"❌ Download failed: {dl_resp.status_code} - {dl_resp.text}")
                        st.stop()
                    csv_bytes = dl_resp.content

                    base = uploaded_file.name.rsplit(".", 1)[0]

                    st.download_button(
                        "Download FULL categorized CSV",
                        data=csv_bytes,
                        file_name=f"{base}_categorized.csv",
                        mime="text/csv"
                    )

                    
                else:
                    # API returned 200 but ok=False (shouldn't happen with current API design but good safety)
                    st.error(f"❌ Error: {data.get('error')} - {data.get('details')}")
            
            # Handle Validation Error (400)
            elif response.status_code == 400:
                try:
                    data = response.json()
                    st.error(f"❌ Validation Error: {data.get('details', 'Invalid request')}")
                except ValueError:
                    st.error(f"❌ Error: {response.text}")
                
            # Handle Server Error (500)
            elif response.status_code == 500:
                try:
                    data = response.json()
                    st.error(f"❌ Server Error: {data.get('details', 'Internal server error')}")
                except ValueError:
                    st.error(f"❌ Server Error: {response.text}")
                
            else:
                st.error(f"❌ Unexpected Error: Status {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Backend API is not reachable. Please make sure the API is running on http://localhost:5000")
            st.info("💡 Tip: Run 'python Flask_API.py' in the backend directory.")
        except Exception as e:
            st.error(f"❌ Error: An unexpected error occurred. {str(e)}")

