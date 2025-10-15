/**
 * API Service for Elderly Connect App
 * Handles all communication with the FastAPI backend
 */

import axios from 'axios';

// Configure your backend URL here
// For local development: 'http://localhost:8000'
const API_BASE_URL = 'http://localhost:8000';

export interface UserInfo {
  user_id: string;
  role: string;
  location: string;
}

export interface Post {
  id: string;
  _id: string;
  user_id: string;
  role: string;
  location: string;
  text: string;
  required_skills: string[];
  interests: string[];
}

export interface QueryResponse {
  success: boolean;
  message: string;
  output?: string;
  audio_response?: string;
  error?: string;
}

export interface FastCreateResponse {
  success: boolean;
  message: string;
  post?: Post;
}

export interface PostsResponse {
  success: boolean;
  posts: Post[];
  count: number;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get all posts for a user
   */
  async getUserPosts(userId: string): Promise<PostsResponse> {
    try {
      const response = await axios.get<PostsResponse>(
        `${this.baseURL}/api/posts/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Process a text query
   */
  async processTextQuery(
    userInfo: UserInfo,
    query: string,
    useVoiceResponse: boolean = false
  ): Promise<QueryResponse> {
    try {
      const response = await axios.post<QueryResponse>(
        `${this.baseURL}/api/query/text`,
        {
          user_info: userInfo,
          query: query,
          use_voice_response: useVoiceResponse,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error processing text query:', error);
      throw error;
    }
  }

  /**
   * Fast create post (no LLM)
   */
  async fastCreatePost(userId: string, query: string): Promise<FastCreateResponse> {
    try {
      const response = await axios.post<FastCreateResponse>(
        `${this.baseURL}/api/posts`,
        { user_id: userId, query }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Process a voice query
   */
  async processVoiceQuery(
    audioUri: string,
    userInfo: UserInfo
  ): Promise<QueryResponse> {
    try {
      const formData = new FormData();
      
      // Append audio file
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'voice_query.m4a',
      } as any);
      
      // Append user info as JSON string
      formData.append('user_info', JSON.stringify(userInfo));

      const response = await axios.post<QueryResponse>(
        `${this.baseURL}/api/query/voice`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error processing voice query:', error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/api/posts/${postId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export default new ApiService();

