// Memory Garden API service
export interface MemoryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  category: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Mock API functions for development
export const memoryGardenApi = {
  getMemories: async (): Promise<ApiResponse<MemoryItem[]>> => {
    return {
      success: true,
      data: [],
      message: 'No memories yet'
    };
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