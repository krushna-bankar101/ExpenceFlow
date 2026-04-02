import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Eye, EyeOff, Mail, Lock, User, Building2, Globe, ChevronRight, ChevronLeft, Check, TrendingUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { countries } from "../../utils/countries";
import { toast } from "sonner";

type Step = 1 | 2;

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
}

const initialForm: FormData = {
  name: "", email: "", password: "", confirmPassword: "",
  companyName: "", country: "", countryCode: "", currency: "", currencySymbol: "", currencyName: "",
};

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [countrySearch, setCountrySearch] = useState("");

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const handleCountrySelect = (c: (typeof countries)[0]) => {
    setForm((f) => ({
      ...f,
      country: c.name,
      countryCode: c.code,
      currency: c.currency,
      currencySymbol: c.currencySymbol,
      currencyName: c.currencyName,
    }));
    setErrors((err) => ({ ...err, country: undefined }));
    setCountrySearch("");
  };

  const validateStep1 = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm password";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<FormData> = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.country) e.country = "Please select a country";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      const result = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        country: form.country,
        countryCode: form.countryCode,
        currency: form.currency,
        currencySymbol: form.currencySymbol,
        currencyName: form.currencyName,
      });
      if (result.success) {
        toast.success("Company and admin account created successfully!");
        navigate("/admin/dashboard");
      } else {
        toast.error(result.error || "Signup failed");
        setStep(1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.currency.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const inputClass = (field: keyof FormData) =>
    `w-full py-3 border rounded-lg text-sm outline-none transition-all`;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2d0a20 0%, #6b1240 50%, #d63384 100%)" }}
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">ExpenseFlow</p>
            <p className="text-pink-300 text-xs">Reimbursement Management</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">Get started in minutes</h2>
            <p className="text-pink-200 leading-relaxed">
              Set up your company, define approval workflows, and start managing expenses efficiently.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            {[
              { n: 1, title: "Create Admin Account", desc: "Your personal login details" },
              { n: 2, title: "Setup Company", desc: "Company info & base currency" },
              { n: 3, title: "Start Managing", desc: "Add employees & configure rules" },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: n < step + 1 ? "rgba(255,255,255,0.3)" : n === step ? "white" : "rgba(255,255,255,0.1)",
                    color: n === step ? "#d63384" : "white",
                  }}
                >
                  {n < step ? <Check size={12} /> : n}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-pink-300 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-pink-300 text-xs">© 2026 ExpenseFlow</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Step {step} of 2</p>
              <p className="text-xs text-gray-400">{step === 1 ? "Account Details" : "Company Setup"}</p>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / 2) * 100}%`, background: "#d63384" }}
              />
            </div>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                <p className="text-gray-500 text-sm mt-1">You'll be the admin of your company</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="John Smith"
                      className={`${inputClass("name")} pl-9 pr-4`}
                      style={{ borderColor: errors.name ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                      onBlur={(e) => (e.target.style.borderColor = errors.name ? "#dc2626" : "#e5e7eb")}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="john@company.com"
                      className={`${inputClass("email")} pl-9 pr-4`}
                      style={{ borderColor: errors.email ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                      onBlur={(e) => (e.target.style.borderColor = errors.email ? "#dc2626" : "#e5e7eb")}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={set("password")}
                      placeholder="Min. 6 characters"
                      className={`${inputClass("password")} pl-9 pr-10`}
                      style={{ borderColor: errors.password ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                      onBlur={(e) => (e.target.style.borderColor = errors.password ? "#dc2626" : "#e5e7eb")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      placeholder="Repeat password"
                      className={`${inputClass("confirmPassword")} pl-9 pr-10`}
                      style={{ borderColor: errors.confirmPassword ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                      onBlur={(e) => (e.target.style.borderColor = errors.confirmPassword ? "#dc2626" : "#e5e7eb")}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2"
                  style={{ background: "#d63384" }}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Setup your company</h1>
                <p className="text-gray-500 text-sm mt-1">Company currency is set based on country</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={set("companyName")}
                      placeholder="Acme Corporation"
                      className={`${inputClass("companyName")} pl-9 pr-4`}
                      style={{ borderColor: errors.companyName ? "#dc2626" : "#e5e7eb" }}
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                      onBlur={(e) => (e.target.style.borderColor = errors.companyName ? "#dc2626" : "#e5e7eb")}
                    />
                  </div>
                  {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                    <input
                      type="text"
                      value={countrySearch || form.country}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      onFocus={() => setCountrySearch("")}
                      placeholder="Search country..."
                      className={`${inputClass("country")} pl-9 pr-4`}
                      style={{ borderColor: errors.country ? "#dc2626" : "#e5e7eb" }}
                    />
                    {countrySearch && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredCountries.slice(0, 10).map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleCountrySelect(c)}
                            className="w-full text-left px-4 py-2.5 hover:bg-pink-50 flex items-center justify-between text-sm"
                          >
                            <span>{c.flag} {c.name}</span>
                            <span className="text-gray-400 text-xs">{c.currency}</span>
                          </button>
                        ))}
                        {filteredCountries.length === 0 && (
                          <p className="px-4 py-2.5 text-gray-400 text-sm">No countries found</p>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>

                {form.currency && (
                  <div className="p-4 rounded-lg border flex items-center gap-3" style={{ background: "#fdf2f8", borderColor: "#f9a8d4" }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "#fce4ec" }}>
                      {countries.find((c) => c.code === form.countryCode)?.flag}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{form.currencyName}</p>
                      <p className="text-xs text-gray-500">
                        Company currency: <span className="font-mono font-bold" style={{ color: "#d63384" }}>{form.currencySymbol} {form.currency}</span>
                      </p>
                    </div>
                    <Check size={18} className="ml-auto" style={{ color: "#d63384" }} />
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: isLoading ? "#f9a8d4" : "#d63384" }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Check size={16} /> Create Account</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "#d63384" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
