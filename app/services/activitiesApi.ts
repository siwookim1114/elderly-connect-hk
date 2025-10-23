// Activities API service - Connected to Flask backend
import API_CONFIG from '../config';

export interface Activity {
  id: string;
  name: string;
  category: string;
  district: string;
  venue: string;
  date: string;
  time?: string;
  fee: string;
  description: string;
  mtr_directions?: {
    start_station: string;
    end_station: string;
    estimated_time: string;
    transfers: number;
    lines: string[];
  };
  nearest_mtr_station?: {
    name: string;
    coordinates: [number, number];
    distance_km: number;
  };
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface FilterActivitiesRequest {
  district: string;
  activityType?: string;
  userLocation?: UserLocation;
  startMtrStation?: string; // New parameter for MTR station selection
}

export interface RecommendActivitiesRequest {
  district: string;
  activityType?: string;
  userLocation?: UserLocation;
  startMtrStation?: string; // New parameter for MTR station selection
  userPreferences?: {
    age?: string;
    interests?: string;
    [key: string]: any;
  };
}

export interface ActivitiesResponse {
  activities: Activity[];
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// MTR Stations by district (simplified for demo)
export const MTR_STATIONS_BY_DISTRICT = {
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
};

class ActivitiesApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Get user's current location (fallback method)
  async getCurrentLocation(): Promise<UserLocation | null> {
    // In a real app, this would use the device's geolocation API
    // For now, we'll return null to indicate we couldn't get the location
    // The backend will handle the fallback to a default location
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.log('Geolocation error:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        console.log('Geolocation is not supported by this browser');
        resolve(null);
      }
    });
  }

  // Filter activities by district and type
  async filterActivities(request: FilterActivitiesRequest): Promise<ActivitiesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/activities/filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district: request.district,
          activityType: request.activityType || 'All Types',
          userLocation: request.userLocation,
          startMtrStation: request.startMtrStation
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error filtering activities:', error);
      throw error;
    }
  }

  // Get GenAI recommendations
  async recommendActivities(request: RecommendActivitiesRequest): Promise<ActivitiesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/activities/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          district: request.district,
          activityType: request.activityType || 'All Types',
          userLocation: request.userLocation,
          startMtrStation: request.startMtrStation,
          userPreferences: request.userPreferences || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error recommending activities:', error);
      throw error;
    }
  }

  // Generate activity summary using Ollama
  async generateActivitySummary(activity: Activity, language: 'cantonese' | 'english' = 'cantonese'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/activities/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity: activity,
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error generating activity summary:', error);
      throw error;
    }
  }
}

// Create API service instance
const activitiesApi = new ActivitiesApiService();

export default activitiesApi;