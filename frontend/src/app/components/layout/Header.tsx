import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Bell, ChevronDown, LogOut, User, Settings, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

const routeTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/users": "User Management",
  "/admin/approval-rules": "Approval Rules",
  "/admin/expenses": "All Expenses",
  "/manager/dashboard": "Dashboard",
  "/manager/approvals": "Pending Approvals",
  "/manager/expenses": "Team Expenses",
  "/employee/dashboard": "Dashboard",
  "/employee/submit": "Submit Expense",
  "/employee/expenses": "My Expenses",
};

export function Header() {
  const { currentUser, company, logout } = useAuth();
  const { getPendingForApprover } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!currentUser) return null;

  const title = routeTitles[location.pathname] || "ExpenseFlow";
  const pendingCount = currentUser.role !== "employee"
    ? getPendingForApprover(currentUser.id).length
    : 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleColors: Record<string, string> = {
    admin: "#d63384",
    manager: "#ec4899",
    employee: "#f472b6",
  };

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-30" style={{ borderColor: "#fce7f3" }}>
      <div className="flex items-center gap-3 lg:gap-4">
        {/* Spacer for mobile hamburger */}
        <div className="w-9 lg:hidden" />
        <div>
          <h1 className="font-semibold text-gray-900 text-base leading-none">{title}</h1>
          {company && (
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
              {company.name} · {company.currency} ({company.currencySymbol})
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        {pendingCount > 0 && (
          <button
            onClick={() => navigate(currentUser.role === "manager" ? "/manager/approvals" : "/admin/expenses")}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-pink-50 transition-colors"
          >
            <Bell size={18} />
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ background: "#d63384", fontSize: "10px" }}
            >
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          </button>
        )}

        {/* Company currency badge */}
        {company && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#fdf2f8", color: "#d63384" }}>
            <Building2 size={12} />
            {company.currencySymbol} {company.currency}
          </div>
        )}

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-pink-50 transition-colors"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: roleColors[currentUser.role] }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-none">{currentUser.name}</p>
              <p className="text-xs capitalize leading-none mt-0.5" style={{ color: "#d63384" }}>
                {currentUser.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border shadow-lg z-50 py-1 overflow-hidden" style={{ borderColor: "#fce7f3" }}>
                <div className="px-4 py-3 border-b" style={{ borderColor: "#fce7f3" }}>
                  <p className="font-semibold text-gray-900 text-sm">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium capitalize"
                    style={{ background: "#fce4ec", color: "#d63384" }}
                  >
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={() => { setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                >
                  <User size={14} className="text-gray-400" />
                  My Profile
                </button>

                {currentUser.role === "admin" && (
                  <button
                    onClick={() => { navigate("/admin/approval-rules"); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 transition-colors"
                  >
                    <Settings size={14} className="text-gray-400" />
                    Settings
                  </button>
                )}

                <div className="border-t my-1" style={{ borderColor: "#fce7f3" }} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
