import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  type User,
  type Expense,
  type ApprovalRule,
  apiGetUsers,
  apiGetExpenses,
  apiGetApprovalRules,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiSubmitExpense,
  apiApproveExpense,
  apiRejectExpense,
  apiAdminOverride,
  apiCreateApprovalRule,
  apiUpdateApprovalRule,
  apiDeleteApprovalRule,
} from "../store/data";
import { useAuth } from "./AuthContext";

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "employee";
  managerId?: string;
  department?: string;
}

interface SubmitExpenseData {
  title: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  category: string;
  description: string;
  date: string;
  receiptDataUrl?: string;
  ocrData?: Expense["ocrData"];
}

interface AppContextType {
  users: User[];
  expenses: Expense[];
  approvalRules: ApprovalRule[];
  addUser: (data: CreateUserData) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUser: (id: string, updates: Partial<User> & { password?: string }) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
  submitExpense: (data: SubmitExpenseData) => Promise<Expense>;
  approveExpense: (expenseId: string, approverId: string, comment: string) => Promise<void>;
  rejectExpense: (expenseId: string, approverId: string, comment: string) => Promise<void>;
  adminOverrideExpense: (expenseId: string, action: "approve" | "reject", adminId: string) => Promise<void>;
  addApprovalRule: (data: Omit<ApprovalRule, "id" | "createdAt">) => Promise<ApprovalRule>;
  updateApprovalRule: (id: string, updates: Partial<ApprovalRule>) => Promise<void>;
  removeApprovalRule: (id: string) => Promise<void>;
  getPendingForApprover: (userId: string) => Expense[];
  getEmployeeExpenses: (userId: string) => Expense[];
  getTeamExpenses: (managerId: string) => Expense[];
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [u, e, r] = await Promise.all([
        apiGetUsers(),
        apiGetExpenses("all"),
        apiGetApprovalRules(),
      ]);
      setUsers(u);
      setExpenses(e);
      setApprovalRules(r);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refresh();
    }
  }, [refresh, currentUser]);

  const addUser = useCallback(
    async (data: CreateUserData): Promise<{ success: boolean; error?: string; user?: User }> => {
      try {
        const result = await apiCreateUser(data);
        await refresh();
        return { success: true, user: result.user };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [refresh]
  );

  const updateUser = useCallback(
    async (id: string, updates: Partial<User>) => {
      await apiUpdateUser(id, updates);
      await refresh();
    },
    [refresh]
  );

  const removeUser = useCallback(
    async (id: string) => {
      await apiDeleteUser(id);
      await refresh();
    },
    [refresh]
  );

  const submitExpense = useCallback(
    async (data: SubmitExpenseData): Promise<Expense> => {
      const expense = await apiSubmitExpense(data);
      await refresh();
      return expense;
    },
    [refresh]
  );

  const approveExpense = useCallback(
    async (expenseId: string, _approverId: string, comment: string) => {
      await apiApproveExpense(expenseId, comment);
      await refresh();
    },
    [refresh]
  );

  const rejectExpense = useCallback(
    async (expenseId: string, _approverId: string, comment: string) => {
      await apiRejectExpense(expenseId, comment);
      await refresh();
    },
    [refresh]
  );

  const adminOverrideExpense = useCallback(
    async (expenseId: string, action: "approve" | "reject", _adminId: string) => {
      await apiAdminOverride(expenseId, action);
      await refresh();
    },
    [refresh]
  );

  const addApprovalRule = useCallback(
    async (data: Omit<ApprovalRule, "id" | "createdAt">): Promise<ApprovalRule> => {
      const rule = await apiCreateApprovalRule(data);
      await refresh();
      return rule;
    },
    [refresh]
  );

  const updateApprovalRule = useCallback(
    async (id: string, updates: Partial<ApprovalRule>) => {
      await apiUpdateApprovalRule(id, updates);
      await refresh();
    },
    [refresh]
  );

  const removeApprovalRule = useCallback(
    async (id: string) => {
      await apiDeleteApprovalRule(id);
      await refresh();
    },
    [refresh]
  );

  const getPendingForApprover = useCallback(
    (userId: string): Expense[] => {
      return expenses.filter((e) => {
        if (e.status !== "pending") return false;
        const currentApproval = e.approvals[e.currentApproverStep];
        return currentApproval?.approverId === userId && currentApproval?.status === "pending";
      });
    },
    [expenses]
  );

  const getEmployeeExpenses = useCallback(
    (userId: string): Expense[] => {
      return expenses.filter((e) => e.employeeId === userId);
    },
    [expenses]
  );

  const getTeamExpenses = useCallback(
    (managerId: string): Expense[] => {
      const teamIds = users.filter((u) => u.managerId === managerId).map((u) => u.id);
      return expenses.filter((e) => teamIds.includes(e.employeeId));
    },
    [expenses, users]
  );

  return (
    <AppContext.Provider
      value={{
        users,
        expenses,
        approvalRules,
        addUser,
        updateUser,
        removeUser,
        submitExpense,
        approveExpense,
        rejectExpense,
        adminOverrideExpense,
        addApprovalRule,
        updateApprovalRule,
        removeApprovalRule,
        getPendingForApprover,
        getEmployeeExpenses,
        getTeamExpenses,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
