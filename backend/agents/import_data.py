import sys
import os

# Add the parent directory to the Python path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import json
from utils.mongo import ElderDB

def import_leisure_data():
    """Import leisure program data from the government website into MongoDB"""
    
    # URL of the data source
    url = "https://www.lcsd.gov.hk/datagovhk/event/leisure_prog.json"
    
    try:
        # Fetch the data from the website
        print("Fetching data from the website...")
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the JSON data
        data = response.json()
        print(f"Successfully fetched {len(data)} records")
        
        # Connect to the database
        print("Connecting to the database...")
        db = ElderDB()
        
        # Connect to the collection (you can change the database and collection names as needed)
        collection = db.connect_collection("elderly_connect_db", "leisure_programs")
        
        # Insert the data into the collection
        print("Inserting data into the database...")
        result = collection.insert_many(data)
        print(f"Successfully inserted {len(result.inserted_ids)} records")
        
        # Close the database connection
        db.close_connection()
        print("Database connection closed")
        
        return len(result.inserted_ids)
        
    except requests.RequestException as e:
        print(f"Error fetching data from the website: {e}")
        return 0
    except Exception as e:
        print(f"Error importing data: {e}")
        return 0

if __name__ == "__main__":
    count = import_leisure_data()
    print(f"Import completed. {count} records were added to the database.")