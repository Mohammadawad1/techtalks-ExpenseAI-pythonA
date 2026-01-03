# ExpenseAI 🚀

ExpenseAI is an intelligent, full-stack expense tracking application that leverages Machine Learning to automatically categorize transactions and provides powerful visual analytics for personal finance management.

## ✨ Features

*   **Smart Categorization**: Uses a Scikit-learn Logistic Regression model to predict transaction categories (e.g., Food, Transportation, Utilities) based on descriptions.
*   **Interactive Dashboard**:
    *   **Top 10 Expenses**: Visualize your largest single spendings with vibrant, category-coded bars.
    *   **Weekly Trends**: Track spending patterns over time (excluding income).
    *   **Net Cash Flow**: Compare income vs. expenses monthly to track savings.
    *   **Category Breakdown**: Interactive pie and bar charts showing where your money goes.
*   **CSV Import**: Easily upload bank statements for bulk processing.
*   **Verification Mode**: "Human-in-the-loop" interface to review and correct AI predictions, which retrains the model on-the-fly for better accuracy.
*   **Export Reports**: Download individual charts as PNGs or generate a comprehensive, multi-page PDF report.
*   **Modern UI**: Responsive design with Dark/Light mode support, built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
*   **React** (Vite)
*   **Tailwind CSS** (Styling & Design System)
*   **Recharts** (Data Visualization)
*   **Framer Motion** (Animations)
*   **html-to-image & jsPDF** (Reporting)

### Backend
*   **FastAPI** (High-performance Python Web Framework)
*   **SQLite** (Database)
*   **SQLAlchemy** (ORM)
*   **Pandas & Scikit-learn** (Data Processing & Machine Learning)

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   Python 3.10+
*   Node.js 16+

### 1. Repository Setup
```bash
git clone <repository-url>
cd ExpenseAI
```

### 2. Backend Setup
The backend handles the API, database, and machine learning model.

```bash
# 1. Create a virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# 3. Install dependencies
# (Ensure you are in the root directory where requirements.txt is located)
pip install -r requirements.txt

# 4. Run the server
cd backend
uvicorn app.main:app --reload --port 8000
```
*The API will be available at `http://localhost:8000` (Docs at `/docs`)*

### 3. Frontend Setup
The frontend provides the user interface.

```bash
# Open a new terminal window
cd frontend

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```
*The app will be running at `http://localhost:5173`*

## 💡 Usage Workflow
1.  **Upload**: Go to the **Upload** page and drag & drop your bank CSV file.
2.  **Review**: The AI will categorize transactions. Use the **Categories** page to verify or correct them.
    *   *Tip*: Correcting a category and clicking "Sync" will verify the transaction and update the user history.
    *   *Tip*: Click "Optimize AI Model" to retrain the model with your corrections.
3.  **Analyze**: Visit the **Dashboard** to see your financial health, spending trends, and net cash flow.
4.  **Export**: Use the download buttons on charts or the "Download Full Report" button for a complete PDF summary.

## 🔒 Security
*   Environment variables are managed via `.env` (not committed).
*   Database files are excluded from version control.