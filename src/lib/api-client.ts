/**
 * API Client for Matrix QA Backend
 * Handles all HTTP requests to backend endpoints with proper error handling and token management.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://matrix-qa-backend.onrender.com"
).replace(/\/$/, "");
const TOKEN_KEY = "matrix_qa_auth_token_v2";
const AUTH_EVENT = "matrix-qa-auth-changed";

export const getAuthToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const getErrorMessage = (data: unknown, status: number): string => {
  if (typeof data === "object" && data !== null && "message" in data) {
    const m = (data as { message?: unknown }).message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string" && m.trim()) return m;
  }
  if (typeof data === "object" && data !== null && "error" in data) {
    const e = (data as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return `Server Error (${status}). Please try again later.`;
};

export const apiRequest = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  if (!API_BASE_URL) {
    throw new Error("Matrix QA API endpoint is not configured. Set VITE_API_BASE_URL.");
  }

  const { requiresAuth = false, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(fetchOptions.headers);
  const isMultipart = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  if (!isMultipart) headers.set("Content-Type", "application/json");

  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, { ...fetchOptions, headers });
    if (!response.ok) {
      throw new Error(getErrorMessage(await response.json().catch(() => ({})), response.status));
    }
    if (response.status === 204) return {} as T;
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        "Service is currently unavailable. Please check your connection or try again later.",
      );
    }
    throw error;
  }
};

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  workspaceName: string;
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
  user: { id: string; email: string; fullName?: string | null };
  accessToken: string;
}
export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
  members?: Array<{ id: string; userId: string; role: string }>;
}
export interface CreateOrganizationRequest {
  name: string;
}
export interface Workspace {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  projects?: Project[];
}
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  workspaceId: string;
  defaultTargetUrl?: string | null;
  targetUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface CreateWorkspaceRequest {
  organizationId: string;
  name: string;
  description?: string;
}
export interface CreateProjectRequest {
  name: string;
  description?: string;
  organizationId: string;
  workspaceId: string;
  defaultTargetUrl?: string;
}
export interface TriggerRunRequest {
  targetUrl?: string;
  idempotencyKey?: string;
  email?: string;
  password?: string;
  signupData?: { fullName: string; email: string; password: string; confirmPassword?: string };
}
export interface TriggerRunResponse {
  id: string;
  projectId: string;
  status: string;
  queued?: boolean;
  incomplete?: boolean;
  reportReady?: boolean;
  errorMessage?: string | null;
}

export interface RunEvent {
  type: string;
  timestamp: number;
  target?: string;
  label?: string;
  x?: number;
  y?: number;
  url?: string;
  subtype?: string;
  status?: number;
  message?: string;
  filename?: string;
  [key: string]: unknown;
}

export interface RunAssertion {
  name: string;
  expected: unknown;
  actual: unknown;
  status: "passed" | "failed" | string;
  timestamp: number;
}

export interface RunChapter {
  title: string;
  startTimestamp: number;
}
export interface RunScreenshot {
  filename: string;
  timestamp: number;
  t?: number;
  label: string;
  url?: string;
}
export interface RunError {
  subtype: string;
  timestamp: number;
  message: string;
  status?: number;
  target?: string;
  x?: number;
  y?: number;
}
export interface RunSummary {
  assertionsPassed: number;
  assertionsFailed: number;
  hardErrorCount: number;
  bugCount: number;
}

export type VideoArtifactStatus = "not_available" | "ready" | "raw_only" | "failed";

export interface ArtifactStatus {
  video?: {
    status?: VideoArtifactStatus;
    finalUploaded?: boolean;
    rawUploaded?: boolean;
    error?: string;
  };
  artifactError?: string | null;
}

export interface RunReport {
  id?: string;
  runId?: string;
  projectId?: string;
  status: string;
  errorMessage?: string | null;
  incomplete?: boolean;
  reportReady?: boolean;
  targetUrl?: string;
  startedAt?: string | Date;
  finishedAt?: string | Date;
  durationSec?: number;
  triggeredBy?: { id?: string; name?: string | null; email?: string | null } | string | null;
  passed?: number;
  failed?: number;
  bugs?: number;
  scenarios?: number;
  summary?: RunSummary;
  events?: RunEvent[];
  assertions?: RunAssertion[];
  chapters?: RunChapter[];
  screenshots?: RunScreenshot[];
  errors?: RunError[];
  evidenceFiles?: Record<string, string | null>;
  finalVideo?: string | null;
  rawVideo?: string | null;
  artifactStatus?: ArtifactStatus;
  evidenceLog?: string | null;
  auditLog?: string | null;
  homepage?: string | null;
  afterNavigation?: string | null;
  [key: string]: unknown;
}

export const authApi = {
  ping: async (): Promise<{ status: string }> => apiRequest("/health"),
  signup: async (data: SignUpRequest): Promise<SignUpResponse> =>
    apiRequest("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  verifyEmail: async (data: VerifyEmailRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.accessToken) setAuthToken(response.accessToken);
    return response;
  },
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.accessToken) setAuthToken(response.accessToken);
    return response;
  },
  getCurrentUser: (): Promise<CurrentUserResponse> =>
    apiRequest("/auth/me", { requiresAuth: true }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ message: string }>("/auth/change-password", { method: "POST", body: JSON.stringify(data), requiresAuth: true }),
  logoutAll: async () => {
    const response = await apiRequest<{ message: string }>("/auth/logout-all", { method: "POST", requiresAuth: true });
    clearAuthToken();
    return response;
  },
  requestPasswordReset: (email: string) =>
    apiRequest<{ message: string }>("/auth/request-password-reset", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    apiRequest<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),
  requestEmailChange: (data: { newEmail: string; currentPassword: string }) =>
    apiRequest<{ message: string }>("/auth/request-email-change", { method: "POST", body: JSON.stringify(data), requiresAuth: true }),
  confirmEmailChange: (token: string) =>
    apiRequest<{ message: string }>("/auth/confirm-email-change", { method: "POST", body: JSON.stringify({ token }) }),
  loginWithGithub: (): void => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  },
  loginWithGoogle: (): void => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
  handleOAuthCallback: async (code: string, provider: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>(
      `/auth/oauth/callback?code=${encodeURIComponent(code)}&provider=${encodeURIComponent(provider)}`,
    );
    if (response.accessToken) setAuthToken(response.accessToken);
    return response;
  },
};

export const organizationsApi = {
  list: (): Promise<Organization[]> => apiRequest("/organizations", { requiresAuth: true }),
  create: (data: CreateOrganizationRequest): Promise<Organization> =>
    apiRequest("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: true,
    }),
  get: (id: string): Promise<Organization> =>
    apiRequest(`/organizations/${encodeURIComponent(id)}`, { requiresAuth: true }),
  rename: (id: string, name: string): Promise<Organization> =>
    apiRequest(`/organizations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ name }), requiresAuth: true }),
  removeMember: (id: string, memberId: string) =>
    apiRequest<{ message: string }>(`/organizations/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, { method: "DELETE", requiresAuth: true }),
  remove: (id: string) => apiRequest<Organization>(`/organizations/${encodeURIComponent(id)}`, { method: "DELETE", requiresAuth: true }),
};

export const workspacesApi = {
  list: (organizationId: string): Promise<Workspace[]> =>
    apiRequest(`/workspaces?organizationId=${encodeURIComponent(organizationId)}`, {
      requiresAuth: true,
    }),
  create: (data: CreateWorkspaceRequest): Promise<Workspace> =>
    apiRequest("/workspaces", { method: "POST", body: JSON.stringify(data), requiresAuth: true }),
  get: (id: string): Promise<Workspace> =>
    apiRequest(`/workspaces/${encodeURIComponent(id)}`, { requiresAuth: true }),
  rename: (id: string, name: string): Promise<Workspace> =>
    apiRequest(`/workspaces/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ name }), requiresAuth: true }),
  remove: (id: string) => apiRequest<Workspace>(`/workspaces/${encodeURIComponent(id)}`, { method: "DELETE", requiresAuth: true }),
};

export const usersApi = {
  getProfile: (): Promise<CurrentUserResponse> => apiRequest("/users/me", { requiresAuth: true }),
  updateProfile: (data: { fullName: string }): Promise<CurrentUserResponse> =>
    apiRequest("/users/me", { method: "PATCH", body: JSON.stringify(data), requiresAuth: true }),
  uploadAvatar: (file: File): Promise<CurrentUserResponse> => {
    const body = new FormData();
    body.append("avatar", file);
    return apiRequest("/users/me/avatar", { method: "POST", body, requiresAuth: true });
  },
  removeAvatar: (): Promise<CurrentUserResponse> => apiRequest("/users/me/avatar", { method: "DELETE", requiresAuth: true }),
};

export const projectsApi = {
  list: (organizationId: string, workspaceId?: string): Promise<Project[]> => {
    const params = new URLSearchParams({ organizationId });
    if (workspaceId) params.set("workspaceId", workspaceId);
    return apiRequest(`/projects?${params.toString()}`, { requiresAuth: true });
  },
  create: (data: CreateProjectRequest): Promise<Project> =>
    apiRequest("/projects", { method: "POST", body: JSON.stringify(data), requiresAuth: true }),
  remove: (projectId: string): Promise<Project> =>
    apiRequest(`/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
      requiresAuth: true,
    }),
};

export type RunStatus = "passed" | "failed" | "running" | "queued";

export interface RunListItem {
  id: string;
  projectId: string;
  status: string;
  targetUrl: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string;
  errorMessage?: string | null;
  hardErrorCount?: number;
  attemptCount?: number;
}

export const runsApi = {
  list: (projectId: string): Promise<RunListItem[]> =>
    apiRequest(`/projects/${encodeURIComponent(projectId)}/runs`, { requiresAuth: true }),
  triggerRun: async (projectId: string, data: TriggerRunRequest): Promise<TriggerRunResponse> => {
    const idempotencyKey =
      data.idempotencyKey ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `frontend-${Date.now()}`);
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/runs`, {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ ...data, idempotencyKey }),
      requiresAuth: true,
    });
  },
  getReport: async (projectId: string, runId: string): Promise<RunReport> => {
    const encodedProjectId = encodeURIComponent(projectId);
    const encodedRunId = encodeURIComponent(runId);
    return apiRequest<RunReport>(`/projects/${encodedProjectId}/runs/${encodedRunId}/report`, {
      requiresAuth: true,
    });
  },
};

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
      console.warn("[Matrix QA] VITE_ALLOCATION_WEBHOOK_URL not set; skipping allocation request.");
      return;
    }
    return apiRequest<void>(webhookUrl, { method: "POST", body: JSON.stringify(data) });
  },
};
