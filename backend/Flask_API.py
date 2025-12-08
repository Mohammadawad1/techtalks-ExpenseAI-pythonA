

from flask import Flask, request, jsonify
import os
import pandas as pd

app = Flask(__name__)


@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Endpoint to receive and validate CSV file uploads
    
    Validations:
    1. Check that a file is included in the request
    2. Check that the file has a .csv extension
    3. Check that the file is not empty
    
    Returns:
        JSON response with status and message
        - 200: Success
        - 400: Client-side validation error
        - 500: Server-side error
    """
    try:
        # Validation 1: Check that a file is included in the request
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file part in the request. Please include a file.'
            }), 400
        
        file = request.files['file']
        
        # Check if filename is empty (no file selected)
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file part in the request. Please include a file.'
            }), 400
        
        # Validation 2: Check that the file has a .csv extension
        if not file.filename.lower().endswith('.csv'):
            return jsonify({
                'status': 'error',
                'message': 'Invalid file type. Only CSV files are allowed.'
            }), 400
        
        # Validation 3: Check that the file is not empty and has actual data
        try:
            # Reset file pointer to read CSV
            file.seek(0)
            # Try to read CSV and check if it has data rows
            df = pd.read_csv(file)
            if df.empty:
                return jsonify({
                    'status': 'error',
                    'message': 'The uploaded file is empty. CSV file must contain at least one data row.'
                }), 400
        except Exception as csv_error:
            # If CSV parsing fails, it might be corrupted or not a valid CSV
            return jsonify({
                'status': 'error',
                'message': f'Invalid CSV file. Could not parse CSV: {str(csv_error)}'
            }), 400
        
        # All validations passed
        return jsonify({
            'status': 'success',
            'message': 'CSV file is valid.'
        }), 200
        
    except Exception as e:
        # Server-side error
        return jsonify({
            'status': 'error',
            'message': f'An unexpected error occurred: {str(e)}'
        }), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'API is running'
    }), 200


if __name__ == '__main__':
    # Port can be changed via environment variable, defaults to 5000
    port = int(os.environ.get('PORT', 5000))
    # Note: The warning about development server is expected and normal for local development
    # For production, use a WSGI server like gunicorn, waitress, or uwsgi
    app.run(debug=True, port=port)

