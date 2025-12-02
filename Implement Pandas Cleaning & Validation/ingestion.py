import pandas as pd
import numpy as np
import re
import uuid  
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class DataCleaner:
    #Initialize the DataCleaner with the file path
    def __init__(self, file_path):        
        self.file_path = file_path
        self.df = None
        self.cleaning_log = []

    #Log each cleaning step
    def log_step(self, step, message, records_affected=None):        
        log_entry = {
            'step': step,
            'message': message,
            'records_affected': records_affected,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'current_shape': self.df.shape if self.df is not None else None
        }
        self.cleaning_log.append(log_entry)
        print(f"[{log_entry['timestamp']}] {step}: {message}")

    #Load data with different encodings to handle encoding issues   
    def load_data(self):
        encodings = ['utf-8', 'iso-8859-1', 'latin1', 'cp1252']        
        for encoding in encodings:
            try:
                self.df = pd.read_csv(self.file_path, encoding=encoding)
                self.log_step('LOAD', f'Successfully loaded with {encoding} encoding')
                break
            except UnicodeDecodeError:
                continue        
        if self.df is None:
            raise ValueError("Could not load file with any supported encoding")            
        return self.df
    
    #Remove rows with null values in critical columns
    def remove_null_rows(self):        
        initial_count = len(self.df)        
        # Identify critical columns that shouldn't have nulls
        critical_columns = ['transaction_id', 'date', 'amount', 'category']        
        # Remove rows where ALL critical columns are null
        rows_all_null = self.df[critical_columns].isnull().all(axis=1)
        self.df = self.df[~rows_all_null]        
        # For transaction_id specifically - it's mandatory
        rows_null_transaction = self.df['transaction_id'].isnull()
        self.df = self.df[~rows_null_transaction]        
        # For amount - remove rows with null amounts
        rows_null_amount = self.df['amount'].isnull()
        self.df = self.df[~rows_null_amount]        
        # For date - remove rows with null dates
        rows_null_date = self.df['date'].isnull()
        self.df = self.df[~rows_null_date]        
        final_count = len(self.df)
        removed = initial_count - final_count        
        self.log_step('REMOVE_NULLS', f'Removed {removed} rows with null values', removed)
        return self.df
    
    #Normalize column names: lowercase, remove spaces, special characters
    def normalize_column_names(self):        
        original_columns = self.df.columns.tolist()        
        # Create a mapping for column name normalization
        column_mapping = {}
        new_columns = []        
        for col in original_columns:
            # Convert to lowercase
            new_col = col.lower()            
            # Replace spaces and special characters with underscores
            new_col = re.sub(r'[^a-z0-9]', '_', new_col)            
            # Remove multiple consecutive underscores
            new_col = re.sub(r'_+', '_', new_col)            
            # Remove leading/trailing underscores
            new_col = new_col.strip('_')            
            # Ensure the column name is not empty
            if not new_col:
                new_col = 'unnamed_column'            
            column_mapping[col] = new_col
            new_columns.append(new_col)        
        # Apply the new column names
        self.df.columns = new_columns        
        self.log_step('NORMALIZE_COLUMNS', f'Normalized columns: {column_mapping}')
        return self.df
    
    #Validate that all required columns exist and have data
    def validate_required_columns(self):        
        required_columns = ['transaction_id', 'date', 'description', 'amount', 'category', 'created_at']        
        # Check if all required columns exist
        missing_columns = [col for col in required_columns if col not in self.df.columns]        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")        
        # Validate each column
        validation_results = {}        
        # 1. transaction_id validation
        transaction_id_count = self.df['transaction_id'].count()
        unique_transaction_ids = self.df['transaction_id'].nunique()
        validation_results['transaction_id'] = {
            'total': transaction_id_count,
            'unique': unique_transaction_ids,
            'duplicates': transaction_id_count - unique_transaction_ids
        }        
        # 2. date validation
        valid_dates = pd.to_datetime(self.df['date'], errors='coerce').notna().sum()
        validation_results['date'] = {
            'total': len(self.df),
            'valid': int(valid_dates),
            'invalid': len(self.df) - int(valid_dates)
        }        
        # 3. amount validation
        # Convert amount to numeric, handling errors
        self.df['amount_numeric'] = pd.to_numeric(self.df['amount'], errors='coerce')
        valid_amounts = self.df['amount_numeric'].notna().sum()
        validation_results['amount'] = {
            'total': len(self.df),
            'valid_numeric': int(valid_amounts),
            'invalid_numeric': len(self.df) - int(valid_amounts),
            'negative': (self.df['amount_numeric'] < 0).sum(),
            'zero': (self.df['amount_numeric'] == 0).sum()
        }        
        # 4. category validation
        valid_categories = ['food_&_dining', 'bills_&_utilities', 'shopping', 'income_&_transfers','education', 'entertainment', 'transportation', 'other', 'health_&_medical']        
        # Clean category names first
        self.df['category_clean'] = self.df['category'].str.strip().str.lower()
        valid_category_count = self.df['category_clean'].isin(valid_categories).sum()        
        validation_results['category'] = {
            'total': len(self.df),
            'valid': int(valid_category_count),
            'invalid': len(self.df) - int(valid_category_count),
            'unique_categories': self.df['category_clean'].nunique()
        }        
        self.log_step('VALIDATE_COLUMNS', 'Column validation completed')        
        # Print validation report
        print("\n" + "="*60)
        print("COLUMN VALIDATION REPORT")
        print("="*60)        
        for col, stats in validation_results.items():
            print(f"\n{col.upper()}:")
            for key, value in stats.items():
                print(f"  {key.replace('_', ' ').title()}: {value}")        
        return validation_results
    
    #Perform additional data cleaning and fixing
    def clean_and_fix_data(self):        
        initial_count = len(self.df)    
        # 1. Fix encoding in text columns
        text_columns = ['description', 'category']
        for col in text_columns:
            if col in self.df.columns:
                # Remove non-ASCII characters and extra whitespace
                self.df[col] = self.df[col].astype(str).apply(
                    lambda x: x.encode('ascii', 'ignore').decode('ascii').strip()
                )        
        # 2. Fix transaction_id format (UUID validation)
        def is_valid_uuid(uuid_str):
            #Check if string is a valid UUID
            if pd.isna(uuid_str):
                return False
            uuid_str = str(uuid_str).strip()
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            return bool(re.match(uuid_pattern, uuid_str.lower()))        
        valid_uuids = self.df['transaction_id'].apply(is_valid_uuid)
        invalid_uuids_count = (~valid_uuids).sum()        
        # Generate new UUIDs for invalid ones
        if invalid_uuids_count > 0:
            for idx in self.df[~valid_uuids].index:
                self.df.at[idx, 'transaction_id'] = str(uuid.uuid4())        
        # 3. Fix date format
        self.df['date'] = pd.to_datetime(self.df['date'], errors='coerce')
        # Remove rows with invalid dates
        self.df = self.df[self.df['date'].notna()]        
        # 4. Fix amount format
        # Convert amount to numeric, remove currency symbols, etc.
        self.df['amount'] = pd.to_numeric(self.df['amount'], errors='coerce')
        # Remove negative amounts and zero amounts (or keep if valid for your use case)
        self.df = self.df[(self.df['amount'] > 0) & (self.df['amount'].notna())]        
        # 5. Fix category names
        category_mapping = {
            # Fix typos and variations
            'food & dining': 'food_&_dining',
            'food_and_dining': 'food_&_dining',
            'bills & utilities': 'bills_&_utilities',
            'bills_and_utilities': 'bills_&_utilities',
            'income & transfers': 'income_&_transfers',
            'income_and_transfers': 'income_&_transfers',
            'health & medical': 'health_&_medical',
            'health_and_medical': 'health_&_medical',
            'unknown category': 'other',  # Map unknown categories to 'other'
            '': 'other',  # Map empty categories to 'other'
            'unknown': 'other',
        }        
        # Apply category mapping
        self.df['category'] = self.df['category'].str.strip().str.lower()
        self.df['category'] = self.df['category'].replace(category_mapping)        
        # Standardize remaining categories
        valid_categories = ['food_&_dining', 'bills_&_utilities', 'shopping', 'income_&_transfers','education', 'entertainment', 'transportation', 'other', 'health_&_medical']        
        # Map any categories not in the valid list to 'other'
        self.df.loc[~self.df['category'].isin(valid_categories), 'category'] = 'other'        
        # 6. Fix created_at date
        self.df['created_at'] = pd.to_datetime(self.df['created_at'], errors='coerce')
        # Fill missing created_at with transaction date + 1 day
        self.df['created_at'] = self.df['created_at'].fillna(self.df['date'] + pd.Timedelta(days=1))        
        # 7. Remove duplicate rows
        initial_len = len(self.df)
        self.df = self.df.drop_duplicates()
        duplicates_removed = initial_len - len(self.df)        
        # 8. Remove rows where created_at is before transaction date
        invalid_dates = self.df['created_at'] < self.df['date']
        self.df = self.df[~invalid_dates]        
        final_count = len(self.df)
        total_removed = initial_count - final_count        
        self.log_step('CLEAN_DATA', f'Cleaned data. Removed {total_removed} rows total', total_removed)
        self.log_step('CLEAN_DATA', f'Removed {duplicates_removed} duplicate rows', duplicates_removed)        
        return self.df
    
    #Generate a comprehensive cleaning report
    def generate_cleaning_report(self):        
        print("\n" + "="*60)
        print("DATA CLEANING COMPLETE - SUMMARY REPORT")
        print("="*60)        
        print(f"\nOriginal file: {self.file_path}")
        print(f"Final dataset shape: {self.df.shape}")
        print(f"Total records: {len(self.df)}")        
        print("\nCleaning Steps Performed:")
        for i, log in enumerate(self.cleaning_log, 1):
            print(f"{i}. {log['step']}: {log['message']}")        
        print("\nData Quality Metrics:")
        print(f"Missing values: {self.df.isnull().sum().sum()}")
        print(f"Duplicate rows removed: {sum(log['records_affected'] for log in self.cleaning_log if 'duplicate' in log['message'].lower())}")        
        print("\nColumn Statistics:")
        for col in self.df.columns:
            if col in ['amount', 'amount_numeric']:
                print(f"  {col}:")
                print(f"    Min: ${self.df[col].min():.2f}")
                print(f"    Max: ${self.df[col].max():.2f}")
                print(f"    Mean: ${self.df[col].mean():.2f}")
                print(f"    Missing: {self.df[col].isnull().sum()}")    
        print(f"\nDate Range:")
        print(f"  Earliest transaction: {self.df['date'].min().strftime('%Y-%m-%d')}")
        print(f"  Latest transaction: {self.df['date'].max().strftime('%Y-%m-%d')}")        
        print(f"\nCategory Distribution:")
        category_counts = self.df['category'].value_counts()
        for category, count in category_counts.items():
            percentage = (count / len(self.df)) * 100
            print(f"  {category}: {count} records ({percentage:.1f}%)")        
        return self.cleaning_log
    
    #Save the cleaned dataset to a CSV file
    def save_clean_data(self, output_path='expenseAI_cleaned_dataset.csv'):        
        # Select only the clean columns
        clean_columns = ['transaction_id', 'date', 'description', 'amount', 'category', 'created_at']        
        # Ensure all columns exist
        available_columns = [col for col in clean_columns if col in self.df.columns]
        clean_df = self.df[available_columns].copy()        
        # Format dates for CSV
        for col in ['date', 'created_at']:
            if col in clean_df.columns:
                clean_df[col] = clean_df[col].dt.strftime('%Y-%m-%d')        
        # Save to CSV with UTF-8 encoding
        clean_df.to_csv(output_path, index=False, encoding='utf-8')        
        self.log_step('SAVE', f'Cleaned data saved to {output_path}')
        print(f"\nCleaned dataset saved to: {output_path}")
        print(f"Records saved: {len(clean_df)}")        
        return output_path

# Main execution function to execute the data cleaning pipeline
def main():
    print("="*70)
    print("EXPENSE DATA CLEANING AND VALIDATION PIPELINE")
    print("="*70)    
    # File paths
    input_file = 'expenseAI_dirty_dataset_20000.csv'
    output_file = 'expenseAI_cleaned_dataset.csv'    
    # Initialize the cleaner
    cleaner = DataCleaner(input_file)    
    try:
        # Step 1: Load data with encoding handling
        print("\n1. LOADING DATA...")
        df = cleaner.load_data()
        print(f"   Initial records: {len(df)}")        
        # Step 2: Normalize column names
        print("\n2. NORMALIZING COLUMN NAMES...")
        df = cleaner.normalize_column_names()
        print(f"   Columns normalized: {list(df.columns)}")        
        # Step 3: Remove null rows
        print("\n3. REMOVING NULL ROWS...")
        df = cleaner.remove_null_rows()
        print(f"   Records after null removal: {len(df)}")        
        # Step 4: Validate required columns
        print("\n4. VALIDATING REQUIRED COLUMNS...")
        validation_results = cleaner.validate_required_columns()        
        # Step 5: Clean and fix data
        print("\n5. CLEANING AND FIXING DATA...")
        df = cleaner.clean_and_fix_data()
        print(f"   Records after cleaning: {len(df)}")        
        # Step 6: Generate report
        print("\n6. GENERATING CLEANING REPORT...")
        cleaner.generate_cleaning_report()        
        # Step 7: Save cleaned data
        print("\n7. SAVING CLEANED DATA...")
        output_path = cleaner.save_clean_data(output_file)        
        print("\n" + "="*70)
        print("CLEANING PIPELINE COMPLETE!")
        print("="*70)        
        # Show final data preview
        print("\nFirst 5 rows of cleaned data:")
        print(df.head().to_string())        
        print(f"\nOutput saved to: {output_path}")
        print(f"Final dataset shape: {df.shape}")        
    except Exception as e:
        print(f"\nERROR during cleaning: {str(e)}")
        import traceback
        traceback.print_exc()

# Run the cleaning pipeline
if __name__ == "__main__":
    main()