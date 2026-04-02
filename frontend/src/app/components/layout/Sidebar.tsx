import { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  TrendingUp, LayoutDashboard, Users, Settings, LogOut, ChevronLeft, ChevronRight,
  Receipt, CheckSquare, UserCheck, FileText, Briefcase, PlusCircle, History, Shield,
  Menu, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number;
}

export function Sidebar() {
  const { currentUser, company, logout } = useAuth();
  const { getPendingForApprover } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!currentUser) return null;

  const pendingCount = currentUser.role !== "employee"
    ? getPendingForApprover(currentUser.id).length
    : 0;

  const adminNav: NavItem[] = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "User Management" },
    { to: "/admin/approval-rules", icon: Settings, label: "Approval Rules" },
    { to: "/admin/expenses", icon: Receipt, label: "All Expenses" },
  ];

  const managerNav: NavItem[] = [
    { to: "/manager/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/manager/approvals", icon: CheckSquare, label: "Pending Approvals", badge: pendingCount },
    { to: "/manager/expenses", icon: Briefcase, label: "Team Expenses" },
  ];

  const employeeNav: NavItem[] = [
    { to: "/employee/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/employee/submit", icon: PlusCircle, label: "Submit Expense" },
    { to: "/employee/expenses", icon: History, label: "My Expenses" },
  ];

  const navItems =
    currentUser.role === "admin" ? adminNav :
    currentUser.role === "manager" ? managerNav :
    employeeNav;

  const roleInfo = {
    admin: { label: "Administrator", icon: Shield, color: "#f472b6" },
    manager: { label: "Manager", icon: UserCheck, color: "#fb7185" },
    employee: { label: "Employee", icon: FileText, color: "#f9a8d4" },
  }[currentUser.role];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col" style={{ background: "#1e0a16" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#3d1030" }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#d63384" }}>
              <TrendingUp size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{company?.name || "ExpenseFlow"}</p>
              <p className="text-xs truncate" style={{ color: "#9c4070" }}>Reimbursement System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: "#d63384" }}>
            <TrendingUp size={16} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-6 h-6 rounded items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg" style={{ background: "#2d0a20" }}>
          <div className="flex items-center gap-2">
            <roleInfo.icon size={13} style={{ color: roleInfo.color }} />
            <span className="text-xs font-medium" style={{ color: roleInfo.color }}>
              {roleInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? "#d63384" : "transparent",
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.classList.contains("text-white") || el.style.background !== "#d63384") {
                el.style.background = "#2d0a20";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (el.style.background === "#2d0a20") el.style.background = "transparent";
            }}
            onClick={() => setMobileOpen(false)}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{label}</span>
                    {badge != null && badge > 0 && (
                      <span
                        className="flex items-center justify-center min-w-5 h-5 rounded-full text-white text-xs font-bold px-1"
                        style={{ background: isActive ? "rgba(255,255,255,0.3)" : "#d63384" }}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge != null && badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: "#d63384", fontSize: "10px" }}
                  >
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t" style={{ borderColor: "#3d1030" }}>
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
            style={{ background: "#d63384", color: "white" }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs truncate" style={{ color: "#9c4070" }}>{currentUser.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center mt-1 py-1 text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-9 h-9 rounded-lg flex items-center justify-center text-white"
        style={{ background: "#d63384" }}
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
        style={{ background: "#1e0a16" }}
      >
        <SidebarContent />
      </div>
    </>
  );
}
