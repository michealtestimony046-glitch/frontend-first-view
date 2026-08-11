/**
 * API Client for Matrix QA Backend
 * Handles all HTTP requests to backend endpoints with proper error handling and token management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'matrix_qa_auth_token';
const AUTH_EVENT = 'matrix-qa-auth-changed';

export const getAuthToken = (): string | null => typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};
export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

interface RequestOptions extends RequestInit { requiresAuth?: boolean; }
const getErrorMessage = (data: unknown, status: number): string => {
  if (typeof data === 'object' && data !== null && 'message' in data) { const m = (data as { message?: unknown }).message; if (Array.isArray(m)) return m.join(', '); if (typeof m === 'string' && m.trim()) return m; }
  if (typeof data === 'object' && data !== null && 'error' in data) { const e = (data as { error?: unknown }).error; if (typeof e === 'string' && e.trim()) return e; }
  return `Server Error (${status}). Please try again later.`;
};
export const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { requiresAuth = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...fetchOptions.headers };
  if (requiresAuth) { const token = getAuthToken(); if (!token) throw new Error('No authentication token found'); headers['Authorization'] = `Bearer ${token}`; }
  try {
    const response = await fetch(url, { ...fetchOptions, headers });
    if (!response.ok) throw new Error(getErrorMessage(await response.json().catch(() => ({})), response.status));
    if (response.status === 204) return {} as T;
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') throw new Error('Service is currently unavailable. Please check your connection or try again later.');
    throw error;
  }
};

export interface SignUpRequest { email: string; password: string; fullName: string; }
export interface SignUpResponse { message: string; email: string; }
export interface VerifyEmailRequest { email: string; code: string; }
export interface AuthResponse { user: { id: string; email: string; fullName?: string | null }; accessToken: string; }
export interface CurrentUserResponse { id: string; email: string; fullName?: string | null; createdAt?: string; }
export interface LoginRequest { email: string; password: string; }
export interface Organization { id: string; name: string; ownerId: string; createdAt?: string; updatedAt?: string; members?: Array<{ id: string; userId: string; role: string }>; }
export interface CreateOrganizationRequest { name: string; }
export interface Project { id: string; name: string; description?: string | null; organizationId: string; targetUrl?: string | null; createdAt?: string; updatedAt?: string; }
export interface CreateProjectRequest { name: string; description?: string; organizationId: string; targetUrl?: string; }
export interface TriggerRunRequest { project_id: string; }
export interface TriggerRunResponse { run_id: string; status: string; }

export const authApi = {
  ping: async (): Promise<{ status: string }> => apiRequest('/health'),
  signup: async (data: SignUpRequest): Promise<SignUpResponse> => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: async (data: VerifyEmailRequest): Promise<AuthResponse> => { const response = await apiRequest<AuthResponse>('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }); if (response.accessToken) setAuthToken(response.accessToken); return response; },
  login: async (data: LoginRequest): Promise<AuthResponse> => { const response = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }); if (response.accessToken) setAuthToken(response.accessToken); return response; },
  getCurrentUser: (): Promise<CurrentUserResponse> => apiRequest('/auth/me', { requiresAuth: true }),
  loginWithGithub: (): void => { window.location.href = `${API_BASE_URL}/auth/github`; },
  loginWithGoogle: (): void => { window.location.href = `${API_BASE_URL}/auth/google`; },
  handleOAuthCallback: async (code: string, provider: string): Promise<AuthResponse> => { const response = await apiRequest<AuthResponse>(`/auth/oauth/callback?code=${encodeURIComponent(code)}&provider=${encodeURIComponent(provider)}`); if (response.accessToken) setAuthToken(response.accessToken); return response; },
};

export const organizationsApi = {
  list: (): Promise<Organization[]> => apiRequest('/organizations', { requiresAuth: true }),
  create: (data: CreateOrganizationRequest): Promise<Organization> => apiRequest('/organizations', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  get: (id: string): Promise<Organization> => apiRequest(`/organizations/${encodeURIComponent(id)}`, { requiresAuth: true }),
};

export const projectsApi = {
  list: (organizationId: string): Promise<Project[]> => apiRequest(`/projects?organizationId=${encodeURIComponent(organizationId)}`, { requiresAuth: true }),
  create: (data: CreateProjectRequest): Promise<Project> => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
};

export const runsApi = {
  triggerRun: async (data: TriggerRunRequest): Promise<TriggerRunResponse> => apiRequest('/v1/runs', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
};

export interface AllocationRequest { source: string; email: string; workload: string; submittedAt: string; }
export const billingApi = {
  submitAllocationRequest: async (data: AllocationRequest): Promise<void> => {
    const webhookUrl = import.meta.env.VITE_ALLOCATION_WEBHOOK_URL;
    if (!webhookUrl) { console.warn('[Matrix QA] VITE_ALLOCATION_WEBHOOK_URL not set; skipping allocation request.'); return; }
    return apiRequest<void>(webhookUrl, { method: 'POST', body: JSON.stringify(data) });
  },
};
