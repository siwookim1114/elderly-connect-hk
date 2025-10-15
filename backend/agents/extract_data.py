import sys
import os
from datetime import datetime

# Add the parent directory to the Python path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.mongo import ElderDB

def extract_activities_data():
    """Extract specific data structure from the leisure programs data"""
    
    try:
        # Connect to the database
        print("Connecting to the database...")
        db = ElderDB()
        
        # Connect to the collection
        collection = db.connect_collection("elderly_connect_db", "leisure_programs")
        
        # Extract all documents
        cursor = collection.find()
        
        activities = []
        districts = set()
        
        # Process each document
        for doc in cursor:
            # Extract activity information
            activity = {
                "program_code": doc.get("PGM_CODE"),
                "chinese_name": doc.get("TC_PGM_NAME"),
                "english_name": doc.get("EN_PGM_NAME"),
                "chinese_activity_type": doc.get("TC_ACT_TYPE_NAME"),
                "english_activity_type": doc.get("EN_ACT_TYPE_NAME"),
                "chinese_district": doc.get("TC_DISTRICT"),
                "english_district": doc.get("EN_DISTRICT"),
                "start_date": doc.get("PGM_START_DATE"),
                "end_date": doc.get("PGM_END_DATE"),
                "chinese_venue": doc.get("TC_VENUE"),
                "english_venue": doc.get("EN_VENUE"),
                "min_age": doc.get("MIN_AGE"),
                "max_age": doc.get("MAX_AGE"),
                "fee": doc.get("FEE")
            }
            
            activities.append(activity)
            
            # Collect districts
            if doc.get("TC_DISTRICT"):
                districts.add(doc.get("TC_DISTRICT"))
        
        # Convert districts set to list
        districts_list = sorted(list(districts))
        
        # Create the output structure
        output_all = {
            "activities": activities,
            "total": len(activities),
            "districts": districts_list,
            "metadata": {
                "source": "LCSD Official API + SWD DECCs",
                "api_url": "https://www.lcsd.gov.hk/datagovhk/event/leisure_prog.json",
                "created_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_districts": len(districts_list),
                "usage": "GenAI filters 'activities' array by 'district' field"
            }
        }
        
        # Close the database connection
        db.close_connection()
        print("Database connection closed")
        
        return output_all
        
    except Exception as e:
        print(f"Error extracting data: {e}")
        return None

def save_extracted_data():
    """Save the extracted data to a JSON file"""
    import json
    
    data = extract_activities_data()
    
    if data:
        # Save to a file
        output_file = os.path.join(os.path.dirname(__file__), "extracted_activities.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Extracted data saved to {output_file}")
        print(f"Total activities: {data['total']}")
        print(f"Total districts: {data['metadata']['total_districts']}")
        print(f"Districts: {', '.join(data['districts'][:5])}...")  # Show first 5 districts
        
        return data
    else:
        print("Failed to extract data")
        return None

if __name__ == "__main__":
    save_extracted_data()