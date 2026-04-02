import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// Route permissions per role
const roleRoutes: Record<string, string[]> = {
  admin: ["/admin", "/expenses"],
  manager: ["/manager", "/expenses"],
  employee: ["/employee", "/expenses"],
};

export function AppLayout() {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    // Role-based access check
    const path = location.pathname;
    const allowed = roleRoutes[currentUser.role] || [];
    const hasAccess = allowed.some((prefix) => path.startsWith(prefix));
    if (!hasAccess) {
      // Redirect to their own dashboard
      if (currentUser.role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (currentUser.role === "manager") navigate("/manager/dashboard", { replace: true });
      else navigate("/employee/dashboard", { replace: true });
    }
  }, [currentUser, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf2f8" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-600 animate-spin" />
          <p className="text-pink-600 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#fdf2f8" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
