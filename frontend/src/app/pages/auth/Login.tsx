import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Mail, Lock, TrendingUp, Shield, Users, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Welcome back!");
        navigate("/");
      } else {
        toast.error(result.error || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2d0a20 0%, #6b1240 50%, #d63384 100%)" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${80 + Math.random() * 120}px`,
                height: `${80 + Math.random() * 120}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: "rgba(255,255,255,0.15)",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-wide">ExpenseFlow</span>
          </div>
          <p className="text-pink-200 text-sm">Reimbursement Management System</p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Streamline Your<br />Expense Management
            </h2>
            <p className="text-pink-200 text-lg leading-relaxed">
              Multi-level approvals, OCR receipt scanning, and real-time expense tracking — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, title: "Role-Based Access", desc: "Admin, Manager, and Employee portals" },
              { icon: TrendingUp, title: "Smart Approvals", desc: "Conditional rules & multi-step workflows" },
              { icon: Users, title: "Team Management", desc: "Manage users, departments & hierarchies" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-pink-200" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-pink-300 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-pink-300 text-xs">
          © 2026 ExpenseFlow. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#d63384" }}>
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-800">ExpenseFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
            <p className="text-gray-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm outline-none transition-all"
                  style={{
                    borderColor: errors.email ? "#dc2626" : "#e5e7eb",
                    boxShadow: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                  onBlur={(e) => (e.target.style.borderColor = errors.email ? "#dc2626" : "#e5e7eb")}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium" style={{ color: "#d63384" }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border rounded-lg text-sm outline-none transition-all"
                  style={{ borderColor: errors.password ? "#dc2626" : "#e5e7eb" }}
                  onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                  onBlur={(e) => (e.target.style.borderColor = errors.password ? "#dc2626" : "#e5e7eb")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              style={{ background: isLoading ? "#f9a8d4" : "#d63384" }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-lg border border-pink-100 bg-pink-50">
            <p className="text-xs font-semibold text-pink-700 mb-2 uppercase tracking-wide">Demo Credentials</p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Create your account to get started — signup auto-creates an Admin.</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold" style={{ color: "#d63384" }}>
              Create company account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
