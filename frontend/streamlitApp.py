
import streamlit as st
import pandas as pd
import requests

st.title("Welcome To Expense AI!🏦💰")


API_PORT = 5000 
API_URL = f"http://localhost:{API_PORT}/upload"

uploaded_files = st.file_uploader(
    "Upload your csv file here👇🏻", accept_multiple_files=False, type="csv"
)

if uploaded_files is not None:
    # Reset file pointer to beginning
    uploaded_files.seek(0)
    
    # Send file to Flask API for validation
    with st.spinner("Validating file..."):
        try:
            # Prepare file for upload
            files = {'file': (uploaded_files.name, uploaded_files, 'text/csv')}
            
            # Send POST request to Flask API
            response = requests.post(API_URL, files=files)
            
            # Parse response
            try:
                result = response.json()
            except ValueError:
                # If response is not valid JSON
                st.error(f"❌ Error: Invalid response from API. Status code: {response.status_code}")
                st.error(f"Response: {response.text[:200]}")
                st.stop()
            
            if response.status_code == 200 and result.get('status') == 'success':
                # Validation successful
                st.success(result.get('message', 'File validated successfully!'))
                
                # Reset file pointer to read CSV for display
                uploaded_files.seek(0)
                try:
                    df = pd.read_csv(uploaded_files)
                    
                    st.write("📄 File Preview:")
                    st.dataframe(df)
                    
                    st.info("✅ File is valid and ready for processing!")
                except Exception as csv_error:
                    st.warning("⚠️ File validated by API but could not be displayed. Error: " + str(csv_error))
            else:
                # Validation failed
                error_message = result.get('message', 'Validation failed')
                st.error(f"❌ {error_message}")
                
        except requests.exceptions.ConnectionError:
            st.error("❌ Error: Could not connect to the Flask API. Please make sure the API is running on http://localhost:5000")
            st.info("💡 Tip: Run 'python api_prd.py' in your terminal to start the Flask API server.")
        except Exception as e:
            st.error(f"❌ Error: An unexpected error occurred. {str(e)}")

