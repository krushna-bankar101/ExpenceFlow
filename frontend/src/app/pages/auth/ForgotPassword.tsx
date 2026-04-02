import { useState } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft, TrendingUp, CheckCircle, KeyRound } from "lucide-react";


export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Invalid email address"); return; }
    setIsLoading(true);
    setError("");
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1500));

    setSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce4ec 50%, #f8bbda 100%)" }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#d63384" }}>
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg">ExpenseFlow</span>
          </div>

          {!submitted ? (
            <>
              <div className="mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#fce4ec" }}>
                  <KeyRound size={26} style={{ color: "#d63384" }} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
                <p className="text-gray-500 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@company.com"
                      className="w-full pl-9 pr-4 py-3 border rounded-lg text-sm outline-none transition-all"
                      style={{ borderColor: error ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                      onBlur={(e) => (e.target.style.borderColor = error ? "#dc2626" : "#e5e7eb")}
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: isLoading ? "#f9a8d4" : "#d63384" }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#fce4ec" }}>
                <CheckCircle size={32} style={{ color: "#d63384" }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-2">
                We've sent a password reset link to
              </p>
              <p className="font-semibold text-gray-800 mb-6">{email}</p>
              <div className="p-4 rounded-lg text-left text-sm" style={{ background: "#fdf2f8" }}>
                <p className="font-semibold text-gray-700 mb-1">Demo Note:</p>
                <p className="text-gray-500 text-xs">
                  In this demo, your current password remains unchanged. In production, a reset email would be sent.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center text-xs text-gray-400 space-x-4">
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Terms of Service</span>
          <span>·</span>
          <span>Support</span>
        </div>
      </div>
    </div>
  );
}
