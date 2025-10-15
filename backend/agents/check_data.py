import sys
import os

# Add the parent directory to the Python path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.mongo import ElderDB

def check_imported_data():
    """Check the imported leisure program data in MongoDB"""
    
    try:
        # Connect to the database
        print("Connecting to the database...")
        db = ElderDB()
        
        # Connect to the collection
        collection = db.connect_collection("elderly_connect_db", "leisure_programs")
        
        # Get the count of documents
        count = collection.count_documents({})
        print(f"Total documents in leisure_programs collection: {count}")
        
        # Show the first 3 documents
        print("\nFirst 3 documents:")
        cursor = collection.find().limit(3)
        for i, doc in enumerate(cursor, 1):
            print(f"\n--- Document {i} ---")
            print(f"Program Name (TC): {doc.get('TC_PGM_NAME', 'N/A')}")
            print(f"Program Name (EN): {doc.get('EN_PGM_NAME', 'N/A')}")
            print(f"Activity Type: {doc.get('TC_ACT_TYPE_NAME', 'N/A')} / {doc.get('EN_ACT_TYPE_NAME', 'N/A')}")
            print(f"District: {doc.get('TC_DISTRICT', 'N/A')} / {doc.get('EN_DISTRICT', 'N/A')}")
            print(f"Start Date: {doc.get('PGM_START_DATE', 'N/A')}")
            print(f"End Date: {doc.get('PGM_END_DATE', 'N/A')}")
            print(f"Venue: {doc.get('TC_VENUE', 'N/A')} / {doc.get('EN_VENUE', 'N/A')}")
        
        # Show some statistics
        print("\n--- Statistics ---")
        
        # Count by activity type
        pipeline = [
            {"$group": {"_id": "$TC_ACT_TYPE_NAME", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        activity_stats = list(collection.aggregate(pipeline))
        print("\nTop 10 Activity Types:")
        for stat in activity_stats:
            print(f"  {stat['_id']}: {stat['count']}")
        
        # Close the database connection
        db.close_connection()
        print("\nDatabase connection closed")
        
    except Exception as e:
        print(f"Error checking data: {e}")

if __name__ == "__main__":
    check_imported_data()