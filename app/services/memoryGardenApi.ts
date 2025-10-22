// Memory Garden API service - Connected to FastAPI backend
import axios from 'axios';

// API Configuration
// Prefer environment variable (Expo) and fallback to localhost for dev
const API_BASE_URL =
  process.env.EXPO_PUBLIC_MEMORY_GARDEN_API_URL || 'http://localhost:8000';

// Data models matching FastAPI backend
export interface StoredPhoto {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  path: string;
}

export interface StoryRecord {
  id: string;
  date: string;
  weather: string;
  location: string;
  photos: StoredPhoto[];
  story?: string;
  created_at: string;
  updated_at: string;
}

export interface StoryResponse {
  message?: string;
  id: string;
  date: string;
  weather: string;
  location: string;
  photos: StoredPhoto[];
  story?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API service class
class MemoryGardenApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Upload photos and generate story
  async uploadPhotosAndGenerateStory(
    photos: Array<
      | File
      | {
          uri: string;
          name?: string;
          type?: string;
        }
    >,
    date: string,
    weather: string,
    location: string
  ): Promise<StoryResponse> {
    const formData = new FormData();
    
    // Add photos to form data
    photos.forEach((photo, index) => {
      // Support both web File and React Native asset objects
      if (typeof File !== 'undefined' && photo instanceof File) {
        formData.append('photos', photo as File);
      } else {
        const rnPhoto = photo as { uri: string; name?: string; type?: string };
        const name = rnPhoto.name || `photo_${index}.jpg`;
        const type = rnPhoto.type || 'image/jpeg';
        // React Native FormData expects { uri, name, type }
        formData.append('photos', {
          // @ts-ignore - React Native FormData type
          uri: rnPhoto.uri,
          name,
          type,
        } as any);
      }
    });
    
    // Add metadata
    formData.append('date', date);
    formData.append('weather', weather);
    formData.append('location', location);

    const response = await axios.post(`${this.baseURL}/upload/stories`, formData, {
      // Let axios set the correct Content-Type boundary automatically
      headers: {
        ...(typeof document === 'undefined' ? {} : {}),
      },
    });

    return response.data;
  }

  // Get all stories
  async getAllStories(): Promise<StoryResponse[]> {
    const response = await axios.get(`${this.baseURL}/stories`);
    return response.data;
  }

  // Get specific story by ID
  async getStory(storyId: string): Promise<StoryResponse> {
    const response = await axios.get(`${this.baseURL}/stories/${storyId}`);
    return response.data;
  }

  // Get story photos
  async getStoryPhotos(storyId: string): Promise<StoredPhoto[]> {
    const response = await axios.get(`${this.baseURL}/stories/${storyId}/photos`);
    return response.data;
  }

  // Download story photo
  async downloadStoryPhoto(storyId: string, photoId: string): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/stories/${storyId}/photos/${photoId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get photo URL for display
  getPhotoUrl(storyId: string, photoId: string): string {
    return `${this.baseURL}/stories/${storyId}/photos/${photoId}`;
  }

  // Download Cantonese audio
  async downloadCantoneseAudio(storyId: string): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/stories/${storyId}/audio`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Get audio stream URL
  getAudioStreamUrl(storyId: string): string {
    return `${this.baseURL}/stories/${storyId}/audio/stream`;
  }

  // Update story
  async updateStory(
    storyId: string,
    date?: string,
    weather?: string,
    location?: string,
    keepPhotoIds?: string[],
    newPhotos?: File[]
  ): Promise<StoryResponse> {
    const formData = new FormData();
    
    if (date) formData.append('date', date);
    if (weather) formData.append('weather', weather);
    if (location) formData.append('location', location);
    if (keepPhotoIds) formData.append('keep_photo_ids', keepPhotoIds.join(','));
    
    if (newPhotos) {
      newPhotos.forEach(photo => {
        formData.append('photos', photo);
      });
    }

    const response = await axios.put(`${this.baseURL}/stories/${storyId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Delete photos from story
  async deleteStoryPhotos(storyId: string, photoIds: string[]): Promise<StoryRecord> {
    const response = await axios.delete(`${this.baseURL}/stories/${storyId}/photos`, {
      params: {
        photoIds: photoIds.join(',')
      }
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Create API service instance
const memoryGardenApi = new MemoryGardenApiService();

// Legacy interface for backward compatibility
export interface MemoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  category: string;
}

// Legacy API functions for backward compatibility
export const legacyMemoryGardenApi = {
  getMemories: async (): Promise<ApiResponse<MemoryItem[]>> => {
    try {
      const stories = await memoryGardenApi.getAllStories();
      const memories: MemoryItem[] = stories.map(story => ({
        id: story.id,
        title: `Memory from ${story.date}`,
        description: story.story || 'A precious memory',
        imageUrl: story.photos.length > 0 ? memoryGardenApi.getPhotoUrl(story.id, story.photos[0].id) : '',
        date: story.date,
        category: 'Story'
      }));
      
      return {
        success: true,
        data: memories,
        message: 'Memories loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: 'Failed to load memories'
      };
    }
  },

  addMemory: async (memory: Omit<MemoryItem, 'id'>): Promise<ApiResponse<MemoryItem>> => {
    return {
      success: true,
      data: { ...memory, id: Date.now().toString() },
      message: 'Memory added successfully'
    };
  },

  deleteMemory: async (id: string): Promise<ApiResponse<boolean>> => {
    return {
      success: true,
      data: true,
      message: 'Memory deleted successfully'
    };
  }
};

export default memoryGardenApi;