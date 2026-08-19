/**
 * API Client for Matrix QA Backend
 * Handles all HTTP requests to backend endpoints with proper error handling and token management.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://matrix-qa-backend.onrender.com"
).replace(/\/$/, "");
const TOKEN_KEY = "matrix_qa_auth_token_v2";
const AUTH_EVENT = "matrix-qa-auth-changed";
const CLIENT_WORKSPACE_STATE_KEYS = [
  "matrix_qa_active_organization",
  "matrix_qa_active_workspace",
  "matrix_qa_active_project",
] as const;

export const clearClientWorkspaceContext = (): void => {
  if (typeof window !== "undefined") {
    CLIENT_WORKSPACE_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
  }
};

export const getAuthToken = (): string | null =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    clearClientWorkspaceContext();
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    clearClientWorkspaceContext();
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiRequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly endpoint: string) {
    super(message);
    this.name = "ApiRequestError";
  }
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
      throw new ApiRequestError(getErrorMessage(await response.json().catch(() => ({})), response.status), response.status, endpoint);
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
  user: { id: string; email: string; fullName?: string | null; isStaff?: boolean; staffRole?: StaffRole | null };
  accessToken: string;
}
export type StaffRole = "OWNER" | "OPERATIONS_ADMIN" | "OPERATOR" | "VIEWER";
export type StaffMembershipStatus = "ACTIVE" | "DISABLED";
export type StaffInvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "REVOKED";

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  isStaff?: boolean;
  staffRole?: StaffRole | null;
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
  source?: "AI" | "SYSTEM" | "POLICY" | "USER" | string;
  observationId?: string;
  evidenceRefs?: string[];
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
    reason?: string;
  };
  artifactError?: string | null;
}

export type V2EnvironmentKind = "PREVIEW" | "STAGING" | "PRODUCTION";
export type V2MissionAccessMode = "ANONYMOUS" | "TEST_ACCOUNT" | "BROWSER_HANDOFF";
export interface V2MissionSpec {
  version: "mission-v1";
  goal: string;
  accessMode: V2MissionAccessMode;
  riskPolicy: "SAFE_ADAPTIVE";
}
export interface V2CoverageFrontierItem {
  id: string;
  kind: "ROUTE" | "ACTION";
  route: string;
  actionKey?: string;
  label: string;
  tier: V2PolicyTier;
  priority: number;
  status: "UNTESTED" | "BLOCKED";
  reason: string;
}
export interface V2CoverageFrontier {
  items?: V2CoverageFrontierItem[];
  counts: { total: number; untested: number; blocked: number };
}
export type V2ScanStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type V2PlannerMode = "QUICK_SMOKE" | "STANDARD_ADAPTIVE" | "DEEP_MATRIX";

export const normalizeV2PlannerMode = (value: string | null | undefined): V2PlannerMode => {
  switch (String(value ?? "").trim().toUpperCase().replace(/[ -]+/g, "_")) {
    case "STANDARD_ADAPTIVE": return "STANDARD_ADAPTIVE";
    case "DEEP_MATRIX": return "DEEP_MATRIX";
    case "QUICK_SMOKE": return "QUICK_SMOKE";
    default: return "QUICK_SMOKE";
  }
};
export type V2PlanStatus = "DRAFT" | "READY" | "AWAITING_APPROVAL" | "APPROVED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type V2PolicyTier = "SAFE" | "CAUTION" | "DANGEROUS" | "UNKNOWN";
export type V2PolicyStatus = "PENDING" | "ALLOWED" | "BLOCKED" | "APPROVED" | "REJECTED" | "NEEDS_HUMAN_REVIEW";
export type V2CaseStatus = "PLANNED" | "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "WARNING" | "SKIPPED" | "BLOCKED" | "FLAKY" | "NEEDS_REVIEW";

export interface V2Environment {
  id: string;
  organizationId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  kind: V2EnvironmentKind;
  baseUrl: string;
  allowedHostnames?: unknown;
  createdAt?: string;
  updatedAt?: string;
}
export interface V2AiEnrichment {
  enabled: boolean;
  degraded: boolean;
  provider?: string;
  model?: string;
  latencyMs?: number;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd?: number };
  reason?: string;
}

export interface V2ApplicationScan {
  id: string;
  projectId: string;
  environmentId?: string | null;
  status: V2ScanStatus;
  targetUrl: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  summary?: (Record<string, unknown> & { aiEnrichment?: V2AiEnrichment }) | null;
  projectMap?: {
    targetOrigin?: string;
    mission?: V2MissionSpec;
    coverageFrontier?: V2CoverageFrontier;
    features?: string[];
    scannedPages?: Array<{ url: string; route: string; title: string; features?: string[]; authSignals?: Record<string, boolean> }>;
    actions?: Array<{ key: string; text: string; tag: string; tier: V2PolicyTier; reason: string; locatorCandidates?: Array<Record<string, string>> }>;
    riskSummary?: { safe: number; caution: number; dangerous: number };
         httpErrors?: Array<{ status: number; url: string }>;
     aiEnrichment?: V2AiEnrichment;
  } | null;

  errorMessage?: string | null;
  createdAt?: string;
}
export interface V2PolicyDecision {
  id: string;
  scenarioId?: string | null;
  actionKey: string;
  intent: string;
  tier: V2PolicyTier;
  status: V2PolicyStatus;
  reason?: string | null;
}
export interface V2Scenario {
  id: string;
  featureId?: string | null;
  name: string;
  intent: string;
  expectedOutcome: string;
  priority: number;
  status: V2CaseStatus;
  caseStatus?: V2CaseStatus | null;
  steps?: unknown;
  locators?: unknown;
  result?: unknown;
}
export interface V2TestPlan {
  id: string;
  projectId: string;
  environmentId?: string | null;
  name: string;
  mode: V2PlannerMode;
  status: V2PlanStatus;
  version: string;
  estimatedUnits?: number | null;
  reservedUnits?: number | null;
    projectMap?: {
    mission?: V2MissionSpec;
    coverageFrontier?: V2CoverageFrontier;
    billingBreakdown?: { baseScenarioUnits: number; aiDiscoveryUnits: number; estimatedUnits: number; accounting?: string }
  } | null;
  createdAt?: string;
  updatedAt?: string;
  scenarios: V2Scenario[];
  policyDecisions: V2PolicyDecision[];
  testCases?: Array<{ id: string; scenarioId: string; status: V2CaseStatus; result?: unknown }>;
}

export interface RunOutcome {
  status: "COMPLETED" | "PASSED_WITH_FINDINGS" | "PARTIALLY_TESTED" | "BLOCKED" | "FAILED" | string;
  message?: string | null;
  coverage?: { planned: number; completed: number; blocked: number; needsReview: number };
  findings?: { target: number; evidence: number };
}

export interface BrowserHandoff {
  id: string;
  runId: string;
  status: "PENDING" | "CLAIMED" | "COMPLETED" | "CANCELLED" | "EXPIRED" | string;
  reason?: string | null;
  expiresAt: string;
  claimedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  hasCredentials?: boolean;
}

export interface AiSummaryEvidenceRef {
  id: string;
  type: 'SCREENSHOT' | 'OBSERVATION' | 'EVENT' | 'NETWORK' | 'DOM';
  label: string;
}

export interface AiLiveSummary {
  source: 'AI';
  generatedAt: string;
  provider: string;
  model: string;
  configVersion: number;
  headline: string;
  currentObjective: string;
  whatChanged: string[];
  findingsSoFar: string[];
  blockers: string[];
  nextStep: string;
  confidence: number;
  evidenceRefs: AiSummaryEvidenceRef[];
}

export interface AiRunOverview {
  source: 'AI';
  generatedAt: string;
  provider: string;
  model: string;
  configVersion: number;
  headline: string;
  whatWasTested: string[];
  whatTheAgentDid: string[];
  findings: Array<{ severity: string; title: string; explanation: string; evidence: AiSummaryEvidenceRef[] }>;
  coverage: string;
  blockers: string[];
  recommendedNextSteps: string[];
  scenarioVerdicts: Array<{ scenarioId: string; verdict: 'PASSED' | 'FAILED' | 'INCONCLUSIVE'; reason: string; evidence: AiSummaryEvidenceRef[] }>;
}

export interface RunReport {
  id?: string;
  runId?: string;
  projectId?: string;
  status: string;
  errorMessage?: string | null;
  incomplete?: boolean;
  reportReady?: boolean;
  outcome?: RunOutcome | null;
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
  liveAiSummary?: AiLiveSummary | null;
  aiOverview?: AiRunOverview | null;
  aiSummaryBillableMatrixUnits?: number;
  events?: RunEvent[];
  assertions?: RunAssertion[];
  chapters?: RunChapter[];
  screenshots?: RunScreenshot[];
  errors?: RunError[];
  evidenceFiles?: Record<string, string | null>;
  finalVideo?: string | null;
  rawVideo?: string | null;
  artifactStatus?: ArtifactStatus;
  v2Plan?: V2TestPlan | null;
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

export interface CreditsSummary {
  symbol: string;
  unitsPerInternalCredit: number;
  message: string;
  allocatedUnits: number;
  bonusUnits: number;
  reservedUnits: number;
  settledUnits: number;
  refundedUnits: number;
  usedUnits: number;
  availableUnits: number;
  monthlyCeilingUnits: number;
  periodStart: string;
  periodEnd: string;
  usagePercent: number;
  warningLevel: 0 | 70 | 85 | 100;
}

export interface CreditsLedgerEntry {
  id: string;
  workspaceId?: string | null;
  runId?: string | null;
  entryType: string;
  units: number;
  internalCredits: number;
  reason: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface AllocationExtensionRequest {
  id: string;
  workspaceId: string;
  requestedUnits: number;
  reason: string;
  status: string;
  staffNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export const creditsApi = {
  getSummary: (organizationId: string): Promise<CreditsSummary> => apiRequest(`/credits/organizations/${encodeURIComponent(organizationId)}/summary`, { requiresAuth: true }),
  getLedger: (organizationId: string): Promise<CreditsLedgerEntry[]> => apiRequest(`/credits/organizations/${encodeURIComponent(organizationId)}/ledger`, { requiresAuth: true }),
  getRequests: (organizationId: string): Promise<AllocationExtensionRequest[]> => apiRequest(`/credits/organizations/${encodeURIComponent(organizationId)}/requests`, { requiresAuth: true }),
  requestExtension: (organizationId: string, workspaceId: string, data: { requestedUnits: number; reason: string }): Promise<AllocationExtensionRequest> => apiRequest(`/credits/organizations/${encodeURIComponent(organizationId)}/workspaces/${encodeURIComponent(workspaceId)}/requests`, { method: "POST", body: JSON.stringify(data), requiresAuth: true }),
};

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (): Promise<NotificationItem[]> => apiRequest('/notifications', { requiresAuth: true }),
  unreadCount: (): Promise<{ unreadCount: number }> => apiRequest('/notifications/unread-count', { requiresAuth: true }),
  markRead: (id: string) => apiRequest<{ updated: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', requiresAuth: true }),
  markAllRead: () => apiRequest<{ updatedCount: number }>('/notifications/read', { method: 'DELETE', requiresAuth: true }),
};

export interface AdminAllocationRequest {
  id: string;
  requestedUnits: number;
  reason: string;
  status: string;
  staffNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  organization: { id: string; name: string };
  workspace: { id: string; name: string };
  requestedBy: { id: string; email: string; fullName?: string | null };
}

export interface StaffNotificationRecipient {
  id: string;
  email: string;
  label?: string | null;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAiUsageSummary {
  totals: {
    events: number;
    degradedEvents: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    billableMatrixUnits: number;
    latencyMs: number;
    averageLatencyMs: number;
  };
  providers: Array<{ provider: string; model: string; events: number; degradedEvents: number; totalTokens: number; estimatedCostUsd: number; billableMatrixUnits: number }>;
  useCases: Array<{ useCase: string; events: number; degradedEvents: number; totalTokens: number; estimatedCostUsd: number; billableMatrixUnits: number }>;
  organizations: Array<{ organizationId: string; organizationName: string; events: number; degradedEvents: number; totalTokens: number; estimatedCostUsd: number; billableMatrixUnits: number }>;
  recent: Array<{ id: string; organizationId: string; projectId?: string | null; scanId?: string | null; provider: string; model: string; inputTokens: number; outputTokens: number; totalTokens: number; estimatedCostUsd: number; billableMatrixUnits: number; latencyMs: number; degraded: boolean; createdAt: string }>;
}

export interface AdminAiProviderConfig {
  id: string;
  provider: "groq" | "openai" | "gemini" | "openrouter" | "anthropic" | "zai" | "openai_compatible";
  model: string;
  useCase: "DISCOVERY" | "PLANNING" | "BROWSER_AGENT" | "VISION" | "RECOVERY";
  enabled: boolean;
  priority: number;
  secretRef: string;
  secretSource?: "MANAGED" | "DEPLOYMENT" | "MISSING";
  runtimeStatus?: "READY" | "DISABLED" | "MISSING_SECRET";
  baseUrl?: string | null;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  estimatedInputUsdPerMillion: number;
  estimatedOutputUsdPerMillion: number;
  matrixUnitSurcharge: number;
  configVersion: number;
  lastHealthStatus?: string | null;
  lastHealthError?: string | null;
  lastHealthCheckedAt?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAiModelCatalogItem {
  id: string;
  name: string;
  provider: AdminAiProviderConfig["provider"];
  status: "ACTIVE" | "PREVIEW" | "UNKNOWN";
  deprecated: boolean;
  expiresAt?: string | null;
  contextLength?: number | null;
  maxOutputTokens?: number | null;
  inputPriceUsdPerMillion?: number | null;
  outputPriceUsdPerMillion?: number | null;
  inputModalities?: string[];
  outputModalities?: string[];
  supportedParameters?: string[];
  compatibility: { status: "COMPATIBLE" | "WARNING" | "UNKNOWN" | "INCOMPATIBLE"; reasons: string[] };
}

export interface AdminAiModelCatalogResponse {
  provider: AdminAiProviderConfig["provider"];
  useCase?: AdminAiProviderConfig["useCase"];
  endpoint: string;
  source: "LIVE" | "CURATED";
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
  models: AdminAiModelCatalogItem[];
  warnings: string[];
}

export interface ManagedSecretMetadata {
  id: string;
  name: string;
  description?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
  lastHealthStatus?: string | null;
  lastHealthError?: string | null;
  lastHealthCheckedAt?: string | null;
  source: "MANAGED" | "DEPLOYMENT" | "MISSING";
}

export interface ManagedSecretImportResult {
  source: "JSON" | "ENV";
  imported: number;
  rotated: number;
  rejected: number;
  secrets: ManagedSecretMetadata[];
  errors: Array<{ name: string; message: string }>;
}

export interface AdminTelemetrySummary {
  version: { public: string; build: string };
  totals: number;
  sums: Record<string, number | null>;
  averages: Record<string, number | null>;
  recent: Array<Record<string, unknown>>;
  aiUsage?: AdminAiUsageSummary;
  creditUsage?: {
    reservedUnits: number;
    reservedInternalCredits: number;
    grossReservedUnits?: number;
    grossReservedInternalCredits?: number;
    settledUnits: number;
    settledInternalCredits: number;
    refundedUnits: number;
    refundedInternalCredits: number;
  };
}

export interface WorkerHealth {
  healthy: boolean;
  activeRuns: number;
  staleRuns: number;
  statusCounts: Array<{ status: string; _count: { _all: number } }>;
  latestRun?: { id: string; status: string; createdAt: string; finishedAt?: string | null; lastHeartbeatAt?: string | null } | null;
  checkedAt: string;
}

export interface StaffUser {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  isStaff: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface StaffMembership {
  id: string;
  userId: string;
  role: StaffRole;
  status: StaffMembershipStatus;
  createdAt: string;
  updatedAt: string;
  disabledAt?: string | null;
  user: StaffUser;
  invitedBy?: StaffUser | null;
  disabledBy?: StaffUser | null;
}
export interface StaffInvitation {
  id: string;
  email: string;
  proposedName?: string | null;
  role: StaffRole;
  status: StaffInvitationStatus;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  revokedAt?: string | null;
  inviter?: StaffUser | null;
}
export interface StaffAuditEvent {
  id: string;
  eventType: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: StaffUser | null;
  targetUser?: StaffUser | null;
}
export interface StaffManagementData {
  staff: StaffMembership[];
  invitations: StaffInvitation[];
  audit: StaffAuditEvent[];
}
export interface StaffInvitationPreview {
  valid: boolean;
  message?: string;
  id?: string;
  email?: string;
  proposedName?: string | null;
  role?: StaffRole;
  inviterName?: string;
  expiresAt?: string;
}

export const adminApi = {
  listAllocationRequests: (status?: string): Promise<AdminAllocationRequest[]> => apiRequest(`/admin/allocation-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`, { requiresAuth: true }),
  reviewAllocationRequest: (id: string, data: { status: 'APPROVED' | 'DECLINED'; staffNote?: string }) => apiRequest<AdminAllocationRequest>(`/admin/allocation-requests/${encodeURIComponent(id)}/review`, { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  listRecipients: (): Promise<StaffNotificationRecipient[]> => apiRequest('/admin/notification-recipients', { requiresAuth: true }),
  listManagedSecrets: (): Promise<ManagedSecretMetadata[]> => apiRequest('/admin/secrets', { requiresAuth: true }),
  saveManagedSecret: (data: { name: string; value: string; description?: string }): Promise<ManagedSecretMetadata> => apiRequest('/admin/secrets', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  importManagedSecrets: (data: { source: "JSON" | "ENV"; entries: Array<{ name: string; value: string; description?: string }> }): Promise<ManagedSecretImportResult> => apiRequest('/admin/secrets/import', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  deleteManagedSecret: (name: string): Promise<{ name: string; deleted: boolean }> => apiRequest('/admin/secrets', { method: 'DELETE', body: JSON.stringify({ name }), requiresAuth: true }),
  saveRecipient: (data: { email: string; label?: string }) => apiRequest<StaffNotificationRecipient>('/admin/notification-recipients', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  disableRecipient: (id: string) => apiRequest<StaffNotificationRecipient>(`/admin/notification-recipients/${encodeURIComponent(id)}`, { method: 'DELETE', requiresAuth: true }),
  broadcast: (data: { title: string; message: string; audience?: 'ALL_USERS' | 'STAFF' }) => apiRequest<{ deliveredCount: number; audience: string }>('/admin/notifications/broadcast', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  telemetry: (): Promise<AdminTelemetrySummary> => apiRequest('/admin/telemetry', { requiresAuth: true }),
  listAiProviderConfigs: (): Promise<AdminAiProviderConfig[]> => apiRequest('/admin/ai-provider-configs', { requiresAuth: true }),
  listAiModelCatalog: (params: { provider: AdminAiProviderConfig["provider"]; secretRef: string; baseUrl?: string; useCase?: AdminAiProviderConfig["useCase"]; refresh?: boolean }): Promise<AdminAiModelCatalogResponse> => {
    const search = new URLSearchParams({ provider: params.provider, secretRef: params.secretRef });
    if (params.baseUrl) search.set("baseUrl", params.baseUrl);
    if (params.useCase) search.set("useCase", params.useCase);
    if (params.refresh) search.set("refresh", "true");
    return apiRequest(`/admin/ai-provider-configs/catalog?${search.toString()}`, { requiresAuth: true });
  },
  saveAiProviderConfig: (data: Partial<AdminAiProviderConfig> & Pick<AdminAiProviderConfig, 'provider' | 'model' | 'useCase' | 'secretRef'>): Promise<AdminAiProviderConfig> => apiRequest('/admin/ai-provider-configs', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  healthCheckAiProviderConfig: (id: string): Promise<AdminAiProviderConfig> => apiRequest(`/admin/ai-provider-configs/${encodeURIComponent(id)}/health-check`, { method: 'POST', requiresAuth: true }),
  deleteAiProviderConfig: (id: string): Promise<{ id: string; deleted: boolean }> => apiRequest(`/admin/ai-provider-configs/${encodeURIComponent(id)}`, { method: 'DELETE', requiresAuth: true }),
  workerHealth: (): Promise<WorkerHealth> => apiRequest('/admin/worker-health', { requiresAuth: true }),
  listStaff: (): Promise<StaffManagementData> => apiRequest('/admin/staff', { requiresAuth: true }),
  inviteStaff: (data: { emails: string[]; proposedName?: string; role?: StaffRole; internalNote?: string }) => apiRequest<{ results: Array<{ email: string; status: string; invitationId?: string; message?: string }> }>('/admin/staff/invitations', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  resendStaffInvitation: (id: string) => apiRequest<{ id: string; status: StaffInvitationStatus; expiresAt: string }>(`/admin/staff/invitations/${encodeURIComponent(id)}/resend`, { method: 'POST', requiresAuth: true }),
  revokeStaffInvitation: (id: string) => apiRequest<{ id: string; status: StaffInvitationStatus }>(`/admin/staff/invitations/${encodeURIComponent(id)}/revoke`, { method: 'POST', requiresAuth: true }),
  changeStaffRole: (userId: string, role: StaffRole) => apiRequest<StaffMembership>(`/admin/staff/${encodeURIComponent(userId)}/role`, { method: 'PATCH', body: JSON.stringify({ role }), requiresAuth: true }),
  disableStaff: (userId: string) => apiRequest<StaffMembership>(`/admin/staff/${encodeURIComponent(userId)}/disable`, { method: 'POST', requiresAuth: true }),
  enableStaff: (userId: string) => apiRequest<StaffMembership>(`/admin/staff/${encodeURIComponent(userId)}/enable`, { method: 'POST', requiresAuth: true }),
  revokeStaffSessions: (userId: string) => apiRequest<{ message: string }>(`/admin/staff/${encodeURIComponent(userId)}/revoke-sessions`, { method: 'POST', requiresAuth: true }),
};

export const staffInvitationApi = {
  preview: (token: string): Promise<StaffInvitationPreview> => apiRequest(`/staff-invitations/${encodeURIComponent(token)}`),
  accept: (token: string, data: { password?: string; fullName?: string }) => apiRequest<{ message: string; email: string; existingAccount: boolean }>(`/staff-invitations/${encodeURIComponent(token)}/accept`, { method: 'POST', body: JSON.stringify(data) }),
  decline: (token: string) => apiRequest<{ message: string }>(`/staff-invitations/${encodeURIComponent(token)}/decline`, { method: 'POST' }),
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

const sleepForPlanRetry = (milliseconds: number) => new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));

const isRetryablePlanGenerationError = (error: unknown): error is ApiRequestError =>
  error instanceof ApiRequestError && error.status >= 500 && error.status < 600;

export const v2Api = {
  listEnvironments: (projectId: string): Promise<V2Environment[]> => apiRequest(`/projects/${encodeURIComponent(projectId)}/environments`, { requiresAuth: true }),
  createEnvironment: (data: { organizationId: string; workspaceId: string; projectId: string; name: string; kind?: V2EnvironmentKind; baseUrl: string }): Promise<V2Environment> => apiRequest('/environments', { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  startScan: (projectId: string, data: { environmentId?: string; targetUrl?: string; missionGoal?: string; accessMode?: V2MissionAccessMode } = {}): Promise<V2ApplicationScan> => apiRequest(`/projects/${encodeURIComponent(projectId)}/scans`, { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  listScans: (projectId: string): Promise<V2ApplicationScan[]> => apiRequest(`/projects/${encodeURIComponent(projectId)}/scans`, { requiresAuth: true }),
  getScan: (scanId: string): Promise<V2ApplicationScan> => apiRequest(`/scans/${encodeURIComponent(scanId)}`, { requiresAuth: true }),
  createPlanFromScan: async (scanId: string, data: { name: string; mode?: V2PlannerMode | string; missionGoal?: string; accessMode?: V2MissionAccessMode }): Promise<V2TestPlan> => {
    const payload = { ...data, ...(data.mode ? { mode: normalizeV2PlannerMode(data.mode) } : {}) };
    const request = () => apiRequest<V2TestPlan>(`/scans/${encodeURIComponent(scanId)}/plans`, {
      method: 'POST',
      body: JSON.stringify(payload),
      requiresAuth: true,
    });

    try {
      return await request();
    } catch (error) {
      if (!isRetryablePlanGenerationError(error)) throw error;
      await sleepForPlanRetry(2_500);
      try {
        return await request();
      } catch (retryError) {
        if (!isRetryablePlanGenerationError(retryError)) throw retryError;
        await sleepForPlanRetry(5_000);
        return request();
      }
    }
  },
  getPlan: (planId: string): Promise<V2TestPlan> => apiRequest(`/plans/${encodeURIComponent(planId)}`, { requiresAuth: true }),
  approvePlan: (planId: string): Promise<V2TestPlan> => apiRequest(`/plans/${encodeURIComponent(planId)}/approve`, { method: 'POST', requiresAuth: true }),
  runPlan: (planId: string, data: TriggerRunRequest = {}): Promise<TriggerRunResponse & { planId?: string }> => apiRequest(`/plans/${encodeURIComponent(planId)}/run`, { method: 'POST', body: JSON.stringify(data), requiresAuth: true }),
  approvePolicy: (planId: string, decisionId: string) => apiRequest<V2PolicyDecision>(`/plans/${encodeURIComponent(planId)}/policy/${encodeURIComponent(decisionId)}/approve`, { method: 'POST', requiresAuth: true }),
  rejectPolicy: (planId: string, decisionId: string) => apiRequest<V2PolicyDecision>(`/plans/${encodeURIComponent(planId)}/policy/${encodeURIComponent(decisionId)}/reject`, { method: 'POST', requiresAuth: true }),
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

export type RunStatus = "passed" | "passed_with_findings" | "partially_tested" | "blocked" | "failed" | "running" | "queued";

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
  metadata?: Record<string, unknown> | null;
}

export type RunMessageAuthorType = "USER" | "AGENT" | "SYSTEM";
export type RunMessageKind = "MESSAGE" | "CONTROL" | "APPROVAL" | "STATUS" | "SUMMARY";
export type RunConsoleControlAction = "PAUSE" | "RESUME" | "APPROVE" | "SKIP" | "STOP";

export interface RunMessage {
  id: string;
  runId: string;
  authorId?: string | null;
  authorType: RunMessageAuthorType;
  kind: RunMessageKind;
  action?: string | null;
  body: string;
  metadata?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export const runsApi = {
  list: (projectId: string): Promise<RunListItem[]> =>
    apiRequest(`/projects/${encodeURIComponent(projectId)}/runs`, { requiresAuth: true }),
  getReport: async (projectId: string, runId: string): Promise<RunReport> => {
    const encodedProjectId = encodeURIComponent(projectId);
    const encodedRunId = encodeURIComponent(runId);
    return apiRequest<RunReport>(`/projects/${encodedProjectId}/runs/${encodedRunId}/report`, {
      requiresAuth: true,
    });
  },
  listMessages: (projectId: string, runId: string): Promise<RunMessage[]> =>
    apiRequest<RunMessage[]>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/messages`, { requiresAuth: true }),
  addMessage: (projectId: string, runId: string, body: string, metadata?: Record<string, unknown>): Promise<RunMessage> =>
    apiRequest<RunMessage>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ body, metadata }),
      requiresAuth: true,
    }),
  control: (projectId: string, runId: string, action: RunConsoleControlAction, body?: string): Promise<{ action: RunConsoleControlAction; accepted: boolean; message?: RunMessage }> =>
    apiRequest<{ action: RunConsoleControlAction; accepted: boolean; message?: RunMessage }>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/console/control`, {
      method: "POST",
      body: JSON.stringify({ action, body }),
      requiresAuth: true,
    }),
  deleteMessages: (projectId: string, runId: string): Promise<{ deleted: number }> =>
    apiRequest<{ deleted: number }>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/messages`, { method: "DELETE", requiresAuth: true }),
  getHandoff: (projectId: string, runId: string): Promise<BrowserHandoff | null> =>
    apiRequest<BrowserHandoff | null>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/handoff`, { requiresAuth: true }),
  claimHandoff: (projectId: string, runId: string): Promise<BrowserHandoff> =>
    apiRequest<BrowserHandoff>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/handoff/claim`, { method: "POST", requiresAuth: true, body: JSON.stringify({}) }),
  completeHandoff: (projectId: string, runId: string, data: { email: string; password: string }): Promise<BrowserHandoff> =>
    apiRequest<BrowserHandoff>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/handoff/complete`, { method: "POST", requiresAuth: true, body: JSON.stringify(data) }),
  cancelHandoff: (projectId: string, runId: string): Promise<BrowserHandoff> =>
    apiRequest<BrowserHandoff>(`/projects/${encodeURIComponent(projectId)}/runs/${encodeURIComponent(runId)}/handoff/cancel`, { method: "POST", requiresAuth: true, body: JSON.stringify({}) }),
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
