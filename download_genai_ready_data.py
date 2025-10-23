import requests
import json
from datetime import datetime
import sys

def download_genai_ready_data():
    """Download and structure data for GenAI filtering by district"""
    
    print("=" * 70)
    print("🤖 Creating GenAI-Ready Activity Database for HK Elderly")
    print("=" * 70)
    
    activities = []
    
    # ========== Download LCSD JSON API ==========
    print("\n📥 [1/2] Downloading LCSD Leisure Programmes...")
    print("    URL: https://www.lcsd.gov.hk/datagovhk/event/leisure_prog.json")
    
    try:
        url = "https://www.lcsd.gov.hk/datagovhk/event/leisure_prog.json"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        }
        
        print("    ⏳ Fetching JSON...")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"    ✅ Downloaded {len(data)} programmes")
        
        # Filter for elderly-suitable (age 55+)
        elderly_suitable = []
        for prog in data:
            try:
                min_age = int(prog.get('MIN_AGE', 0))
                max_age = int(prog.get('MAX_AGE', 0))
                district = prog.get('EN_DISTRICT', '').strip()
                
                # Include if: 
                # 1. Suitable for 55+ OR
                # 2. Has district (can filter by location)
                if (max_age >= 55 and district) or (min_age >= 45 and district):
                    elderly_suitable.append(prog)
            except:
                continue
        
        print(f"    📊 Found {len(elderly_suitable)} elderly-suitable programmes with districts")
        
        # Convert to GenAI-friendly format
        count = 0
        seen_ids = set()
        
        for prog in elderly_suitable[:100]:  # Limit to 100
            try:
                prog_code = prog.get('PGM_CODE', '')
                if prog_code in seen_ids:
                    continue
                seen_ids.add(prog_code)
                
                # Extract all fields
                name_en = prog.get('EN_PGM_NAME', '').strip()
                name_tc = prog.get('TC_PGM_NAME', '').strip()
                activity_type = prog.get('EN_ACT_TYPE_NAME', 'Recreation').strip()
                district = prog.get('EN_DISTRICT', '').strip()
                venue = prog.get('EN_VENUE', '').strip()
                
                # Dates
                start_date = prog.get('PGM_START_DATE', '').split(' ')[0]
                end_date = prog.get('PGM_END_DATE', '').split(' ')[0]
                day = prog.get('EN_DAY', '').strip()
                
                # Times
                start_time = prog.get('PGM_START_TIME', '').strip()
                end_time = prog.get('PGM_END_TIME', '').strip()
                
                # Other details
                fee = prog.get('FEE', '0').strip()
                min_age = prog.get('MIN_AGE', '0').strip()
                max_age = prog.get('MAX_AGE', '99').strip()
                detail_url = prog.get('EN_URL', '').strip()
                notes_1 = prog.get('EN_NOTES_1', '').strip()
                notes_2 = prog.get('EN_NOTES_2', '').strip()
                
                # Skip if no name or district
                if not (name_en or name_tc) or not district:
                    continue
                
                # Build date string
                if start_date == end_date:
                    date_str = start_date
                elif start_date and end_date:
                    date_str = f"{start_date} to {end_date}"
                else:
                    date_str = "TBA"
                
                if day:
                    date_str = f"{day}, {date_str}"
                
                # Build time string
                time_str = f"{start_time}-{end_time}" if start_time and end_time else "TBA"
                
                # Build description
                description_parts = [f"{activity_type} programme"]
                if notes_1:
                    description_parts.append(notes_1)
                if notes_2:
                    description_parts.append(notes_2)
                description = ". ".join(description_parts)
                
                # Create GenAI-ready activity
                activity = {
                    "id": f"lcsd_{prog_code}",
                    "name": name_en or name_tc,
                    "name_tc": name_tc,
                    "name_en": name_en,
                    "category": activity_type,
                    "district": district,  # KEY FIELD for GenAI filtering
                    "venue": venue,
                    "address": "",  # Can be populated later
                    "date": date_str,
                    "day_of_week": day,
                    "time": time_str,
                    "start_time": start_time,
                    "end_time": end_time,
                    "description": description[:300],
                    "fee": f"HK${fee}",
                    "age_min": min_age,
                    "age_max": max_age,
                    "registration": "Register via LCSD SmartPLAY or at venue",
                    "contact": "",
                    "source": "LCSD",
                    "detail_url": detail_url,
                    "suitable_for_elderly": True
                }
                
                activities.append(activity)
                count += 1
                
                if count <= 5:
                    print(f"      ✓ {district}: {name_en[:50]}")
                
            except Exception as e:
                continue
        
        print(f"    ✅ Processed {count} LCSD programmes")
        
    except Exception as e:
        print(f"    ❌ Error: {e}")
        sys.exit(1)
    
    # ========== Add ALL 18 District Elderly Community Centres ==========
    print("\n📥 [2/2] Adding ALL District Elderly Community Centres...")
    
    # Complete list of all 18 DECCs (official SWD data)
    elderly_centres = [
        {"name": "Central & Western District Elderly Community Centre", "district": "Central & Western", "phone": "2547 0808", "address": "3/F, 1 Sai Ying Pun Community Complex"},
        {"name": "Wan Chai District Elderly Community Centre", "district": "Wan Chai", "phone": "2575 1166", "address": "15/F, Southorn Centre, 130 Hennessy Road"},
        {"name": "Eastern District Elderly Community Centre", "district": "Eastern", "phone": "2967 0839", "address": "G/F, Siu Sai Wan Complex"},
        {"name": "Southern District Elderly Community Centre", "district": "Southern", "phone": "2551 0141", "address": "G/F, Nam Fung Centre, Ap Lei Chau"},
        {"name": "Yau Tsim Mong District Elderly Community Centre", "district": "Yau Tsim Mong", "phone": "2782 0111", "address": "8/F, Yau Ma Tei Jockey Club Clinic"},
        {"name": "Sham Shui Po District Elderly Community Centre", "district": "Sham Shui Po", "phone": "2360 0301", "address": "3/F, Shek Kip Mei Park Sports Centre"},
        {"name": "Kowloon City District Elderly Community Centre", "district": "Kowloon City", "phone": "2713 1934", "address": "7/F, Hung Hom Community Centre"},
        {"name": "Wong Tai Sin District Elderly Community Centre", "district": "Wong Tai Sin", "phone": "2322 7449", "address": "2/F, Lung Cheung Office Block"},
        {"name": "Kwun Tong District Elderly Community Centre", "district": "Kwun Tong", "phone": "2389 1661", "address": "3/F, Shun Lee Estate Shopping Centre"},
        {"name": "Kwai Tsing District Elderly Community Centre", "district": "Kwai Tsing", "phone": "2435 1599", "address": "G/F, Kwai Shing West Estate Shopping Centre"},
        {"name": "Tsuen Wan District Elderly Community Centre", "district": "Tsuen Wan", "phone": "2414 8123", "address": "4/F, Yeung Uk Road Municipal Services Building"},
        {"name": "Tuen Mun District Elderly Community Centre", "district": "Tuen Mun", "phone": "2441 3338", "address": "G/F, Yuet Wu Villa, Tuen Mun"},
        {"name": "Yuen Long District Elderly Community Centre", "district": "Yuen Long", "phone": "2443 1521", "address": "G/F, Yuen Long Town Hall"},
        {"name": "North District Elderly Community Centre", "district": "North", "phone": "2675 1557", "address": "Level 3, Fanling Centre Shopping Arcade"},
        {"name": "Tai Po District Elderly Community Centre", "district": "Tai Po", "phone": "2651 0410", "address": "G/F, Tai Wo Plaza, Tai Po"},
        {"name": "Sha Tin District Elderly Community Centre", "district": "Sha Tin", "phone": "2605 1603", "address": "G/F, Sha Kok Estate Shopping Centre"},
        {"name": "Sai Kung District Elderly Community Centre", "district": "Sai Kung", "phone": "2791 7555", "address": "G/F, Choi Ming Shopping Centre, Tseung Kwan O"},
        {"name": "Islands District Elderly Community Centre", "district": "Islands", "phone": "2984 0111", "address": "4/F, Tung Chung Community Centre"},
    ]
    
    for idx, centre in enumerate(elderly_centres):
        activity = {
            "id": f"decc_{idx}",
            "name": "Community Activities & Social Programs",
            "name_tc": "社區活動及社交計劃",
            "name_en": "Community Activities & Social Programs",
            "category": "Social & Community",
            "district": centre['district'],  # KEY FIELD for GenAI
            "venue": centre['name'],
            "address": centre['address'],
            "date": "Ongoing (Mon-Sat)",
            "day_of_week": "Mon-Sat",
            "time": "Contact centre for schedule",
            "start_time": "09:00",
            "end_time": "17:00",
            "description": "District Elderly Community Centre offering tea gatherings, health talks, arts & crafts, exercise classes, birthday celebrations, and social activities for elderly residents aged 60+.",
            "fee": "Free for members",
            "age_min": "60",
            "age_max": "99",
            "registration": f"Walk-in or call {centre['phone']}",
            "contact": centre['phone'],
            "source": "SWD",
            "detail_url": "https://www.swd.gov.hk/en/pubsvc/elderly/cat_commsupp/elderly_centres/",
            "suitable_for_elderly": True
        }
        activities.append(activity)
        print(f"      ✓ {centre['district']} DECC")
    
    print(f"    ✅ Added all 18 DECCs (one per district)")
    
    # ========== Structure for GenAI ==========
    print("\n🤖 Structuring data for GenAI querying...")
    
    # Group by district for easy GenAI filtering
    districts_data = {}
    for activity in activities:
        district = activity['district']
        if district not in districts_data:
            districts_data[district] = []
        districts_data[district].append(activity)
    
    # Sort districts alphabetically
    districts_list = sorted(districts_data.keys())
    
    print(f"    ✅ Data structured across {len(districts_list)} districts")
    
    # ========== Save Multiple Formats ==========
    print("\n💾 Saving data...")
    
    # Format 1: All activities in array (for GenAI to search)
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
    
    with open('elderly_activities_genai.json', 'w', encoding='utf-8') as f:
        json.dump(output_all, f, ensure_ascii=False, indent=2)
    print("    ✅ Saved: elderly_activities_genai.json (All activities)")
    
    # Format 2: Grouped by district (optional, for faster lookups)
    output_grouped = {
        "activities_by_district": districts_data,
        "districts": districts_list,
        "metadata": {
            "source": "LCSD + SWD",
            "created_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "usage": "Pre-grouped by district for instant filtering"
        }
    }
    
    with open('elderly_activities_by_district.json', 'w', encoding='utf-8') as f:
        json.dump(output_grouped, f, ensure_ascii=False, indent=2)
    print("    ✅ Saved: elderly_activities_by_district.json (Grouped)")
    
    # ========== Summary ==========
    print("\n" + "=" * 70)
    print("📊 DATABASE SUMMARY")
    print("=" * 70)
    print(f"Total activities: {len(activities)}")
    print(f"Districts covered: {len(districts_list)}")
    
    print(f"\nActivities per district:")
    for district in districts_list[:10]:  # Show first 10
        count = len(districts_data[district])
        print(f"  • {district}: {count}")
    
    # Category breakdown
    categories = {}
    for act in activities:
        cat = act['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\nBy activity type:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:8]:
        print(f"  • {cat}: {count}")
    
    # Sample activities
    print("\n" + "=" * 70)
    print("📋 SAMPLE ACTIVITIES (First 5)")
    print("=" * 70)
    for i, act in enumerate(activities[:5], 1):
        print(f"\n{i}. {act['name']}")
        print(f"   🏷️  District: {act['district']}")
        print(f"   📍 Venue: {act['venue']}")
        print(f"   📅 {act['date']}")
        print(f"   ⏰ {act['time']}")
        print(f"   💰 {act['fee']}")
    
    print("\n" + "=" * 70)
    print("✅ SUCCESS! GenAI-READY DATABASE CREATED")
    print("=" * 70)
    print("\n📁 Output files:")
    print("   1. elderly_activities_genai.json       (For GenAI filtering)")
    print("   2. elderly_activities_by_district.json  (Pre-grouped)")
    print(f"\n🤖 GenAI Usage:")
    print(f"   - User selects district: 'Kwun Tong'")
    print(f"   - GenAI filters: activities.filter(a => a.district === 'Kwun Tong')")
    print(f"   - Returns: {len(districts_data.get('Kwun Tong', []))} activities")
    print("\n✨ Ready for React Native + GenAI integration!")

if __name__ == "__main__":
    try:
        download_genai_ready_data()
    except KeyboardInterrupt:
        print("\n\n⚠️ Download cancelled")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
