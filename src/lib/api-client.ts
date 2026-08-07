/**
 * API Client for Matrix QA Backend
 * Handles all HTTP requests to backend endpoints with proper error handling and token management
 */

// Use the production API URL by default, or an environment variable if provided
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://matrix-first-view--jerrybrian12345.replit.app';

// Token management
const TOKEN_KEY = 'matrix_qa_auth_token';

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// API request interface
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Generic API request handler
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { requiresAuth = false, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add authorization header if required
  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error (${response.status}). Please try again later.`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Service is currently unavailable at ${url}. Please check your connection or try again later.`);
    }
    throw error;
  }
};

// ============ Auth Endpoints ============

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  accessToken: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
}

export const authApi = {
  ping: async (): Promise<{ status: string }> => {
    // Deep fix: Force absolute URL for health check to avoid any domain confusion
    const url = `${API_BASE_URL}/health`;
    console.log(`[Matrix QA] Initiating health check to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[Matrix QA] Health check failed:', error);
      throw error;
    }
  },

  signup: async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.accessToken) {
      setAuthToken(response.accessToken);
    }
    return response;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.accessToken) {
      setAuthToken(response.accessToken);
    }
    return response;
  },

  getCurrentUser: async (): Promise<CurrentUserResponse> => {
    return apiRequest<CurrentUserResponse>('/auth/me', {
      requiresAuth: true,
    });
  },

  /**
   * Initiate GitHub OAuth flow — redirects the browser to the backend's GitHub OAuth endpoint
   */
  loginWithGithub: (): void => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  },

  /**
   * Initiate Google OAuth flow — redirects the browser to the backend's Google OAuth endpoint
   */
  loginWithGoogle: (): void => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  /**
   * Handle OAuth callback with code from URL params
   * Expects query params: ?code=XXX&provider=github|google
   */
  handleOAuthCallback: async (code: string, provider: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>(`/auth/oauth/callback?code=${encodeURIComponent(code)}&provider=${encodeURIComponent(provider)}`, {
      method: 'GET',
    });
    if (response.accessToken) {
      setAuthToken(response.accessToken);
    }
    return response;
  },
};

// ============ Runs Endpoints ============

export interface TriggerRunRequest {
  project_id: string;
}

export interface TriggerRunResponse {
  run_id: string;
  status: string;
}

export const runsApi = {
  triggerRun: async (data: TriggerRunRequest): Promise<TriggerRunResponse> => {
    return apiRequest<TriggerRunResponse>('/v1/runs', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },
};

// ============ Billing Endpoints ============

export interface AllocationRequest {
  source: string;
  email: string;
  workload: string;
  submittedAt: string;
}

export const billingApi = {
  submitAllocationRequest: async (data: AllocationRequest): Promise<void> => {
    const webhookUrl = import.meta.env.VITE_ALLOCATION_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[Matrix QA] VITE_ALLOCATION_WEBHOOK_URL not set; skipping allocation request.');
      return;
    }
    return apiRequest<void>(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Triggering a fresh build to clear deployment cache - 2026-07-25
