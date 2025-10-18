const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any[];
}

interface PaginationResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// API Client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async walletAuth(walletData: {
    walletAddress: string;
    signature: string;
    message: string;
  }) {
    return this.request<{ user: any; token: string }>('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(profileData: {
    displayName?: string;
    bio?: string;
    twitterHandle?: string;
    discordHandle?: string;
    telegramHandle?: string;
  }) {
    return this.request<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Token endpoints
  async getTokens(params: {
    page?: number;
    limit?: number;
    category?: 'graduated' | 'about-to-graduate' | 'newly-created';
    featured?: boolean;
    nsfw?: boolean;
    sortBy?: 'createdAt' | 'marketCap' | 'volume24h' | 'priceChange24h';
    order?: 'asc' | 'desc';
  } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/tokens${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>('/tokens?' + queryParams.toString()) as Promise<PaginationResponse<any>>;
  }

  async getTrendingTokens() {
    return this.request<any[]>('/tokens/trending');
  }

  async getToken(id: string) {
    return this.request<any>(`/tokens/${id}`);
  }

  async createToken(tokenData: {
    name: string;
    symbol: string;
    description: string;
    imageUrl?: string;
    websiteUrl?: string;
    twitterUrl?: string;
    telegramUrl?: string;
    discordUrl?: string;
    totalSupply?: string;
  }) {
    return this.request<any>('/tokens', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  }

  async updateToken(id: string, tokenData: {
    description?: string;
    imageUrl?: string;
    websiteUrl?: string;
    twitterUrl?: string;
    telegramUrl?: string;
    discordUrl?: string;
  }) {
    return this.request<any>(`/tokens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tokenData),
    });
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health');
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };
export type { ApiResponse, PaginationResponse };