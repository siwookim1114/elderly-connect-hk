#!/usr/bin/env python3
"""
Activities Service with GenAI Integration
This service provides enhanced activity filtering with GenAI recommendations
and MTR map connections based on user location.
"""
import os
import json
import time
from typing import List, Dict, Any, Optional
import ollama
import requests

# Load activities data
def load_activities_data():
    """Load activities data from JSON file"""
    with open('/Users/pranavikuntrapakam/elderly-connect-hk/elderly_activities_genai.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# MTR Station coordinates (simplified for demo)
MTR_STATIONS = {
    "Central": (22.2844, 114.1567),
    "Admiralty": (22.2785, 114.1625),
    "Wan Chai": (22.2770, 114.1715),
    "Causeway Bay": (22.2793, 114.1825),
    "Tin Hau": (22.2820, 114.1915),
    "Fortress Hill": (22.2850, 114.1975),
    "North Point": (22.2900, 114.2000),
    "Quarry Bay": (22.2880, 114.2150),
    "Tai Koo": (22.2880, 114.2200),
    "Sai Wan Ho": (22.2850, 114.2250),
    "Shau Kei Wan": (22.2780, 114.2300),
    "Heng Fa Chuen": (22.2700, 114.2400),
    "Chai Wan": (22.2620, 114.2400),
    "Siu Sai Wan": (22.2550, 114.2450),
    "Tseung Kwan O": (22.3150, 114.2650),
    "Tiu Keng Leng": (22.3100, 114.2550),
    "Yau Tong": (22.3050, 114.2450),
    "Lam Tin": (22.3050, 114.2350),
    "Kwun Tong": (22.3050, 114.2250),
    "Ngau Tau Kok": (22.3100, 114.2200),
    "Kowloon Bay": (22.3200, 114.2100),
    "Choi Hung": (22.3300, 114.2050),
    "Diamond Hill": (22.3400, 114.2000),
    "Wong Tai Sin": (22.3450, 114.1900),
    "Prince Edward": (22.3400, 114.1750),
    "Shek Kip Mei": (22.3400, 114.1650),
    "Kowloon Tong": (22.3350, 114.1700),
    "Mong Kok": (22.3250, 114.1700),
    "Prince's Building": (22.2850, 114.1550),
    "Tsim Sha Tsui": (22.2950, 114.1700),
    "Jordan": (22.3050, 114.1700),
    "Yau Ma Tei": (22.3100, 114.1700),
    "Mong Kok East": (22.3250, 114.1750),
    "Tai Wo Hau": (22.3550, 114.1750),
    "Tsuen Wan West": (22.3650, 114.1100),
    "Tsuen Wan": (22.3750, 114.1050),
    "Sham Shui Po": (22.3300, 114.1600),
    "Cheung Sha Wan": (22.3400, 114.1500),
    "Lai Chi Kok": (22.3450, 114.1400),
    "Mei Foo": (22.3500, 114.1300),
    "Lai King": (22.3550, 114.1200),
    "Kwai Fong": (22.3600, 114.1100),
    "Kwai Hing": (22.3650, 114.1000),
    "Tai Wo": (22.4500, 114.1600),
    "Fanling": (22.4900, 114.1400),
    "Sheung Shui": (22.5100, 114.1200),
    "University": (22.4200, 114.2050),
    "Racecourse": (22.3950, 114.2000),
    "Sha Tin": (22.3850, 114.2000),
    "City One": (22.3800, 114.1900),
    "Shek Mun": (22.3750, 114.1800),
    "Tai Shui Hang": (22.3700, 114.1700),
    "Heng On": (22.3650, 114.1600),
    "Ma On Shan": (22.3600, 114.1500),
    "Wu Kai Sha": (22.3550, 114.1400),
    "Mosque Junction": (22.3500, 114.1300),
    "Che Kung Temple": (22.3450, 114.1200),
    "Tai Wai": (22.3800, 114.1800),
    "Shatin Wai": (22.3850, 114.1900),
    "Fo Tan": (22.3900, 114.1950),
    "Racecourse": (22.3950, 114.2000),
    "University": (22.4200, 114.2050),
    "Tai Po Market": (22.4500, 114.1600),
    "Tai Po": (22.4550, 114.1700),
    "Fu Heng": (22.4600, 114.1800),
    "Wan Tau Kok Lai": (22.4650, 114.1900),
    "Wu Kai Sha": (22.3550, 114.1400),
    "Ma On Shan": (22.3600, 114.1500),
    "Heng On": (22.3650, 114.1600),
    "Tai Shui Hang": (22.3700, 114.1700),
    "Shek Mun": (22.3750, 114.1800),
    "City One": (22.3800, 114.1900),
    "Sha Tin": (22.3850, 114.2000),
    "Racecourse": (22.3950, 114.2000),
    "University": (22.4200, 114.2050),
    "Tai Wo": (22.4500, 114.1600),
    "Fanling": (22.4900, 114.1400),
    "Sheung Shui": (22.5100, 114.1200)
}

# District to MTR station mapping
DISTRICT_MTR_STATIONS = {
    "Central & Western": ["Central", "Admiralty", "Sheung Wan", "Sai Ying Pun"],
    "Wan Chai": ["Wan Chai", "Causeway Bay"],
    "Eastern": ["Tin Hau", "Fortress Hill", "North Point", "Quarry Bay", "Tai Koo", "Sai Wan Ho", "Shau Kei Wan", "Heng Fa Chuen", "Chai Wan", "Siu Sai Wan"],
    "Southern": ["Admiralty", "Wong Chuk Hang", "Ocean Park", "Lei Tung"],
    "Yau Tsim Mong": ["Mong Kok", "Prince Edward", "Tsim Sha Tsui", "Jordan", "Yau Ma Tei"],
    "Sham Shui Po": ["Sham Shui Po", "Cheung Sha Wan", "Lai Chi Kok", "Mei Foo", "Lai King"],
    "Kowloon City": ["Kowloon Tong", "Shek Kip Mei", "Kowloon City", "Prince Edward", "Wong Tai Sin"],
    "Wong Tai Sin": ["Wong Tai Sin", "Diamond Hill", "Choi Hung", "Kowloon Bay"],
    "Kwun Tong": ["Kwun Tong", "Ngau Tau Kok", "Kowloon Bay", "Lam Tin", "Yau Tong", "Tiu Keng Leng", "Tseung Kwan O"],
    "Kwai Tsing": ["Kwai Fong", "Kwai Hing", "Tai Wo Hau", "Tsuen Wan West"],
    "Tsuen Wan": ["Tsuen Wan", "Tsuen Wan West"],
    "Tuen Mun": ["Tuen Mun", "Siu Hong", "Tin Shui Wai", "Long Ping", "Yuen Long"],
    "Yuen Long": ["Yuen Long", "Long Ping", "Tin Shui Wai", "Siu Hong", "Tuen Mun"],
    "North": ["Tai Wo", "Fanling", "Sheung Shui"],
    "Tai Po": ["Tai Po Market", "Tai Po", "Fu Heng", "Wan Tau Kok Lai"],
    "Sha Tin": ["Sha Tin", "City One", "Shek Mun", "Tai Shui Hang", "Heng On", "Ma On Shan", "Wu Kai Sha", "Mosque Junction", "Che Kung Temple", "Tai Wai", "Shatin Wai", "Fo Tan", "Racecourse", "University"],
    "Sai Kung": ["Po Lam", "Hang Hau", "Tseung Kwan O"],
    "Islands": ["Hong Kong", "Kennedy Town", "HKU", "Sai Ying Pun"]
}

class ActivitiesService:
    def __init__(self):
        self.activities_data = load_activities_data()
        self.ollama_client = ollama.Client()
        
    def filter_activities(self, district: str, activity_type: str = "All Types") -> List[Dict[str, Any]]:
        """Filter activities by district and type"""
        activities = self.activities_data.get("activities", [])
        print(f"Total activities in data: {len(activities)}")
        print(f"Filtering by district: {district}, activity_type: {activity_type}")
        
        filtered = [
            activity for activity in activities
            if activity.get("district") == district and 
            (activity_type == "All Types" or activity.get("category") == activity_type)
        ]
        
        print(f"Filtered activities count: {len(filtered)}")
        if filtered:
            print(f"First activity: {filtered[0]}")
        
        return filtered
    
    def get_genai_recommendations(self, user_preferences: Dict[str, Any], filtered_activities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get GenAI recommendations based on user preferences"""
        # If no activities, return empty list
        if not filtered_activities:
            return []
        
        # Limit to top 8 activities to reduce processing time
        activities_to_process = filtered_activities[:8]
        
        try:
            # Create a prompt for the LLM with a clearer format
            activities_list = []
            for i, activity in enumerate(activities_to_process):
                activities_list.append({
                    "index": i,
                    "id": activity.get("id", f"activity_{i}"),
                    "name": activity.get("name", ""),
                    "category": activity.get("category", ""),
                    "description": activity.get("description", ""),
                    "venue": activity.get("venue", "")
                })
            
            # More specific prompt that clearly defines the expected output format
            prompt = f"""
You are an AI assistant helping elderly people in Hong Kong find suitable community activities.

USER PREFERENCES:
- District: {user_preferences.get('district', 'Not specified')}
- Activity Type: {user_preferences.get('activity_type', 'Not specified')}
- Age: {user_preferences.get('age', 'Not specified')}
- Interests: {user_preferences.get('interests', 'Not specified')}

ACTIVITIES TO CHOOSE FROM:
{json.dumps(activities_list, indent=2, ensure_ascii=False)}

INSTRUCTIONS:
1. Select the TOP 5 activities that would be MOST SUITABLE for this elderly person
2. Rank them in order of suitability (most suitable first)
3. Return ONLY a JSON array containing the INDEX numbers of the selected activities
4. The format MUST be exactly: [2, 0, 4, 1, 3]
5. DO NOT include any other text, explanation, or formatting
6. ONLY return the array of indexes
7. Make sure the JSON is valid and complete

Example correct response: [2, 0, 4, 1, 3]
Example incorrect responses: 
- "The top 5 activities are [2, 0, 4, 1, 3]"
- "Here are my recommendations: [2, 0, 4, 1, 3]"
- "Recommended activities: [2, 0, 4, 1, 3]"
- Any response with text before or after the array
- Incomplete JSON like {{"index": 2, "id": "..."

Your response:
"""
            
            print(f"Sending prompt to Ollama: {prompt}")
            
            # Record start time
            start_time = time.time()
            
            # Get recommendations from Ollama with stricter parameters for faster response
            response = self.ollama_client.chat(
                model="llama3.1:latest",
                messages=[{"role": "user", "content": prompt}],
                format="json",
                options={
                    "temperature": 0.5,  # Lower temperature for more consistent responses
                    "top_p": 0.9,
                    "num_predict": 50  # Limit output length
                }
            )
            
            # Record end time
            end_time = time.time()
            print(f"Ollama response time: {end_time - start_time:.2f} seconds")
            
            # Parse the response
            # Extract content from the response
            if hasattr(response, 'message') and hasattr(response.message, 'content'):
                content = response.message.content
            else:
                content = str(response)
                
            if content:
                # Clean up the content to ensure it's valid JSON
                content = content.strip()
                print(f"Raw content: {content}")
                
                # Handle different response formats
                if content.startswith("```json"):
                    content = content[7:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                # Try to parse as JSON
                try:
                    parsed_content = json.loads(content)
                    # Handle different possible response formats
                    recommended_indexes = []
                    if isinstance(parsed_content, list):
                        # Direct array response
                        recommended_indexes = parsed_content
                    elif isinstance(parsed_content, dict):
                        # Check for common keys that might contain the indexes
                        for key in ["recommended_activities", "activities", "results", "indexes", "recommendations", "index"]:
                            if key in parsed_content and isinstance(parsed_content[key], list):
                                recommended_indexes = parsed_content[key]
                                break
                        # If no known key found, check if the dict has a single key with list value
                        if not recommended_indexes:
                            for value in parsed_content.values():
                                if isinstance(value, list):
                                    recommended_indexes = value
                                    break
                        # If still no indexes found, use the dict values if it's a simple dict
                        if not recommended_indexes and all(isinstance(v, int) for v in parsed_content.values()):
                            recommended_indexes = list(parsed_content.values())
                    
                    # If still no indexes found, try regex extraction
                    if not recommended_indexes:
                        import re
                        # Look for array pattern in the content
                        array_match = re.search(r'$$(.*?)$$', content)
                        if array_match:
                            array_str = f"[{array_match.group(1)}]"
                            try:
                                recommended_indexes = json.loads(array_str)
                            except:
                                recommended_indexes = []
                    
                    # Validate and filter indexes
                    valid_indexes = []
                    if isinstance(recommended_indexes, list):
                        for index in recommended_indexes:
                            if isinstance(index, int) and 0 <= index < len(activities_to_process):
                                valid_indexes.append(index)
                                if len(valid_indexes) >= 5:  # Limit to top 5
                                    break
                    
                    # Sort activities based on recommendations
                    sorted_activities = []
                    for index in valid_indexes:
                        sorted_activities.append(activities_to_process[index])
                    
                    print(f"Successfully parsed {len(sorted_activities)} recommendations")
                    return sorted_activities
                except json.JSONDecodeError as json_error:
                    print(f"JSON parsing error: {json_error}")
                    print(f"Raw content: {content}")
                    # If JSON parsing fails, try regex extraction
                    import re
                    # Look for array pattern in the content
                    array_matches = re.findall(r'$$(.*?)$$', content)
                    if array_matches:
                        # Try each match
                        for array_str in array_matches:
                            try:
                                array_str = f"[{array_str}]"
                                recommended_indexes = json.loads(array_str)
                                # Validate and filter indexes
                                valid_indexes = []
                                for index in recommended_indexes:
                                    if isinstance(index, int) and 0 <= index < len(activities_to_process):
                                        valid_indexes.append(index)
                                        if len(valid_indexes) >= 5:  # Limit to top 5
                                            break
                                
                                if valid_indexes:
                                    # Sort activities based on recommendations
                                    sorted_activities = []
                                    for index in valid_indexes:
                                        sorted_activities.append(activities_to_process[index])
                                    
                                    print(f"Successfully parsed with regex {len(sorted_activities)} recommendations")
                                    return sorted_activities
                            except Exception as regex_error:
                                print(f"Regex parsing error: {regex_error}")
                                continue
                    else:
                        print("No array pattern found in response")
                    
                    # If all parsing fails, return the first few activities as fallback
                    print("Returning fallback activities due to parsing failure")
                    return activities_to_process[:min(3, len(activities_to_process))]
                
        except Exception as e:
            print(f"Error getting GenAI recommendations: {e}")
            import traceback
            traceback.print_exc()
            
        # If all parsing fails, return original filtered activities (limited to 5)
        print("Returning fallback activities")
        return activities_to_process[:5]
    
    def get_user_location(self, provided_location: Optional[Dict[str, float]] = None) -> Optional[Dict[str, Any]]:
        """Get user's current location (either provided or fallback to default)"""
        # If location is provided from frontend, use it
        if provided_location and 'latitude' in provided_location and 'longitude' in provided_location:
            return {
                "latitude": provided_location['latitude'],
                "longitude": provided_location['longitude'],
                "address": provided_location.get('address', 'User location')
            }
        
        # In a real app, this would use device GPS
        # For demo, we'll return a fixed location
        return {
            "latitude": 22.2844,  # Central
            "longitude": 114.1567,  # Central
            "address": "Central, Hong Kong"
        }
    
    def get_mtr_station_coordinates(self, station_name: str) -> Optional[tuple]:
        """Get coordinates for an MTR station"""
        return MTR_STATIONS.get(station_name)
    
    def find_nearest_mtr_station(self, user_location: Dict[str, float]) -> Optional[Dict[str, Any]]:
        """Find the nearest MTR station to user's location"""
        user_coords = (user_location["latitude"], user_location["longitude"])
        nearest_station = None
        min_distance = float('inf')
        
        for station_name, station_coords in MTR_STATIONS.items():
            # Simple distance calculation (simplified for demo)
            lat_diff = station_coords[0] - user_coords[0]
            lon_diff = station_coords[1] - user_coords[1]
            distance = (lat_diff ** 2 + lon_diff ** 2) ** 0.5
            
            if distance < min_distance:
                min_distance = distance
                nearest_station = {
                    "name": station_name,
                    "coordinates": station_coords,
                    "distance_km": round(distance * 111, 2)  # Rough conversion to km
                }
        
        return nearest_station
    
    def get_mtr_directions(self, start_station: str, end_district: str) -> Optional[Dict[str, Any]]:
        """Get MTR directions from start station to district"""
        # In a real app, this would use MTR API or Google Maps API
        # For demo, we'll provide simplified directions
        
        district_stations = DISTRICT_MTR_STATIONS.get(end_district, [])
        if not district_stations:
            return None
            
        # For demo, we'll just return the first station in the district
        end_station = district_stations[0] if district_stations else end_district
        
        return {
            "start_station": start_station,
            "end_station": end_station,
            "estimated_time": "20-30 minutes",
            "transfers": 0,
            "lines": ["Tsuen Wan Line"]  # Simplified
        }
    
    def enhance_activities_with_directions(self, activities: List[Dict[str, Any]], start_station: str) -> List[Dict[str, Any]]:
        """Enhance activities with MTR directions using a specific start station"""
        # Get the coordinates for the start station
        station_coords = self.get_mtr_station_coordinates(start_station)
        if not station_coords:
            return activities
            
        nearest_station = {
            "name": start_station,
            "coordinates": station_coords,
            "distance_km": 0
        }
        
        enhanced_activities = []
        for activity in activities:
            # Get directions to the district
            directions = self.get_mtr_directions(start_station, activity["district"])
            
            enhanced_activity = activity.copy()
            enhanced_activity["mtr_directions"] = directions
            enhanced_activity["nearest_mtr_station"] = nearest_station
            enhanced_activities.append(enhanced_activity)
            
        return enhanced_activities

# Create service instance
activities_service = ActivitiesService()

# Example usage
if __name__ == "__main__":
    # Example: Filter activities
    filtered = activities_service.filter_activities("Eastern", "Swimming")
    print(f"Found {len(filtered)} activities")
    
    # Example: Get GenAI recommendations
    user_prefs = {
        "district": "Eastern",
        "activity_type": "Swimming",
        "age": "65",
        "interests": "health, social"
    }
    recommendations = activities_service.get_genai_recommendations(user_prefs, filtered)
    print(f"Got {len(recommendations)} recommendations")
    
    # Example: Get user location and directions
    user_location = activities_service.get_user_location()
    if user_location:
        # Find nearest MTR station to the user location
        nearest_station = activities_service.find_nearest_mtr_station(user_location)
        if nearest_station:
            enhanced = activities_service.enhance_activities_with_directions(recommendations[:3], nearest_station["name"])
            print(f"Enhanced {len(enhanced)} activities with directions")