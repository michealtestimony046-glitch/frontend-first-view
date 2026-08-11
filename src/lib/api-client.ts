/**
 * API Client for Matrix QA Backend
 * Handles all HTTP requests to backend endpoints with proper error handling and token management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const getErrorMessage = (errorData: unknown, status: number): string => {
  if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
    const message = (errorData as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
    const error = (errorData as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }

  return `Server Error (${status}). Please try again later.`;
};

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
      throw new Error(getErrorMessage(errorData, response.status));
    }

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
  fullName: string;
}

export interface SignUpResponse {
  message: string;
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName?: string | null;
  };
  accessToken: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt?: string;
}

export const authApi = {
  ping: async (): Promise<{ status: string }> => {
    const url = `${API_BASE_URL}/health`;
    console.log(`[Matrix QA] Initiating health check to: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
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

  signup: async (data: SignUpRequest): Promise<SignUpResponse> => {
    return apiRequest<SignUpResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmail: async (data: VerifyEmailRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/verify-email', {
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

  loginWithGithub: (): void => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  },

  loginWithGoogle: (): void => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  handleOAuthCallback: async (code: string, provider: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>(
      `/auth/oauth/callback?code=${encodeURIComponent(code)}&provider=${encodeURIComponent(provider)}`,
      { method: 'GET' }
    );
    if (response.accessToken) {
      setAuthToken(response.accessToken);
    }
    return response;
  },
};

export interface LoginRequest {
  email: string;
  password: string;
}

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
