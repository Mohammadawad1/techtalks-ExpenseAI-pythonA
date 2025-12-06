-- ==========================
-- ExpenseAI Database Schema
-- ==========================

-- 1. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE(user_id, name)
);

-- 3. Transactions Table
CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    raw_category VARCHAR(50),
    final_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Feedback Table
CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    old_category VARCHAR(50) NOT NULL,
    new_category VARCHAR(50) NOT NULL,
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Exports Table
CREATE TABLE exports (
    export_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    file_name VARCHAR(100) NOT NULL,
    export_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- Indexes for performance
-- ==========================
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_feedback_transaction ON feedback(transaction_id);
CREATE INDEX idx_categories_user ON categories(user_id);
