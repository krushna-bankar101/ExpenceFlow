import { createBrowserRouter } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { IndexRedirect } from "./pages/IndexRedirect";
import { NotFound } from "./pages/NotFound";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { UsersPage } from "./pages/admin/Users";
import { ApprovalRulesPage } from "./pages/admin/ApprovalRules";
import { AdminExpensesPage } from "./pages/admin/AllExpenses";
import { ManagerDashboard } from "./pages/manager/Dashboard";
import { PendingApprovalsPage } from "./pages/manager/PendingApprovals";
import { TeamExpensesPage } from "./pages/manager/TeamExpenses";
import { EmployeeDashboard } from "./pages/employee/Dashboard";
import { SubmitExpensePage } from "./pages/employee/SubmitExpense";
import { MyExpensesPage } from "./pages/employee/MyExpenses";
import { ExpenseDetailPage } from "./pages/shared/ExpenseDetail";
import { Root } from "./pages/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: IndexRedirect },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "forgot-password", Component: ForgotPassword },
      {
        Component: AppLayout,
        children: [
          { path: "admin/dashboard", Component: AdminDashboard },
          { path: "admin/users", Component: UsersPage },
          { path: "admin/approval-rules", Component: ApprovalRulesPage },
          { path: "admin/expenses", Component: AdminExpensesPage },
          { path: "manager/dashboard", Component: ManagerDashboard },
          { path: "manager/approvals", Component: PendingApprovalsPage },
          { path: "manager/expenses", Component: TeamExpensesPage },
          { path: "employee/dashboard", Component: EmployeeDashboard },
          { path: "employee/submit", Component: SubmitExpensePage },
          { path: "employee/expenses", Component: MyExpensesPage },
          { path: "expenses/:id", Component: ExpenseDetailPage },
        ],
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
