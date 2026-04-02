/**
 * API client for the Flask backend.
 * Replaces localStorage-based data operations with REST API calls.
 */

const API_BASE = "/api";

// ─── Token Management ──────────────────────────────────────────────────────────

const TOKEN_KEY = "rms_auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── HTTP Helpers ───────────────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

function get<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

function post<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, { method: "POST", body: JSON.stringify(body) });
}

function put<T>(endpoint: string, body: unknown): Promise<T> {
  return apiFetch<T>(endpoint, { method: "PUT", body: JSON.stringify(body) });
}

function del<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "DELETE" });
}

// ─── Data Types (same as before) ────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
  adminId: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "employee";
  companyId: string;
  managerId?: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApproverStep {
  order: number;
  userId: string;
  userName: string;
  userRole: string;
}

export interface ConditionalRule {
  type: "percentage" | "specific" | "hybrid";
  percentage?: number;
  specificApproverId?: string;
  specificApproverName?: string;
}

export interface ApprovalRule {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isManagerApproverFirst: boolean;
  approvers: ApproverStep[];
  conditionalRule?: ConditionalRule;
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  createdAt: string;
}

export interface ApprovalRecord {
  approverId: string;
  approverName: string;
  step: number;
  status: "pending" | "approved" | "rejected" | "skipped";
  comment?: string;
  timestamp?: string;
}

export interface OCRData {
  rawText: string;
  merchantName?: string;
  amount?: number;
  date?: string;
  description?: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  title: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  amountInCompanyCurrency: number;
  category: string;
  description: string;
  date: string;
  receiptDataUrl?: string;
  ocrData?: OCRData;
  status: "draft" | "pending" | "approved" | "rejected";
  approvalRuleId?: string;
  currentApproverStep: number;
  approvals: ApprovalRecord[];
  adminOverrideBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth API ───────────────────────────────────────────────────────────────────

interface AuthResponse {
  token: string;
  user: User;
  company: Company;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const result = await post<AuthResponse>("/auth/login", { email, password });
  setToken(result.token);
  return result;
}

export async function apiSignup(data: {
  name: string;
  email: string;
  password: string;
  companyName: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
}): Promise<AuthResponse> {
  const result = await post<AuthResponse>("/auth/signup", data);
  setToken(result.token);
  return result;
}

export async function apiGetMe(): Promise<{ user: User; company: Company }> {
  return get<{ user: User; company: Company }>("/auth/me");
}

export function apiLogout(): void {
  clearToken();
}

// ─── Users API ──────────────────────────────────────────────────────────────────

export async function apiGetUsers(): Promise<User[]> {
  return get<User[]>("/users");
}

export async function apiCreateUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  managerId?: string;
  department?: string;
}): Promise<{ success: boolean; user: User }> {
  return post<{ success: boolean; user: User }>("/users", data);
}

export async function apiUpdateUser(id: string, updates: Partial<User> & { password?: string }): Promise<User> {
  return put<User>(`/users/${id}`, updates);
}

export async function apiDeleteUser(id: string): Promise<void> {
  await del(`/users/${id}`);
}

// ─── Expenses API ───────────────────────────────────────────────────────────────

export async function apiGetExpenses(scope?: string, params?: Record<string, string>): Promise<Expense[]> {
  const query = new URLSearchParams(params || {});
  if (scope) query.set("scope", scope);
  return get<Expense[]>(`/expenses?${query.toString()}`);
}

export async function apiGetExpenseById(id: string): Promise<Expense> {
  return get<Expense>(`/expenses/${id}`);
}

export async function apiSubmitExpense(data: {
  title: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  category: string;
  description: string;
  date: string;
  receiptDataUrl?: string;
  ocrData?: OCRData;
}): Promise<Expense> {
  return post<Expense>("/expenses", data);
}

export async function apiUploadReceipt(file: File): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/expenses/upload-receipt", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }

  const result = await res.json();
  return result.url;
}

export async function apiApproveExpense(id: string, comment: string): Promise<Expense> {
  return put<Expense>(`/expenses/${id}/approve`, { comment });
}

export async function apiRejectExpense(id: string, comment: string): Promise<Expense> {
  return put<Expense>(`/expenses/${id}/reject`, { comment });
}

export async function apiAdminOverride(id: string, action: "approve" | "reject"): Promise<Expense> {
  return put<Expense>(`/expenses/${id}/admin-override`, { action });
}

// ─── Approval Rules API ─────────────────────────────────────────────────────────

export async function apiGetApprovalRules(): Promise<ApprovalRule[]> {
  return get<ApprovalRule[]>("/approval-rules");
}

export async function apiCreateApprovalRule(data: Omit<ApprovalRule, "id" | "createdAt">): Promise<ApprovalRule> {
  return post<ApprovalRule>("/approval-rules", data);
}

export async function apiUpdateApprovalRule(id: string, updates: Partial<ApprovalRule>): Promise<ApprovalRule> {
  return put<ApprovalRule>(`/approval-rules/${id}`, updates);
}

export async function apiDeleteApprovalRule(id: string): Promise<void> {
  await del(`/approval-rules/${id}`);
}

