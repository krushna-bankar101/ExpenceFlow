import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { PlusCircle, Search, Receipt, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EXPENSE_CATEGORIES } from "../../utils/countries";

export function MyExpensesPage() {
  const { currentUser, company } = useAuth();
  const { getEmployeeExpenses } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  if (!currentUser) return null;

  const myExpenses = getEmployeeExpenses(currentUser.id);
  const sym = company?.currencySymbol ?? "$";

  const filtered = useMemo(() => {
    return myExpenses
      .filter((e) => {
        const matchSearch =
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()) ||
          e.description.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || e.status === statusFilter;
        const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
        return matchSearch && matchStatus && matchCategory;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [myExpenses, search, statusFilter, categoryFilter]);

  const stats = {
    total: myExpenses.length,
    pending: myExpenses.filter((e) => e.status === "pending").length,
    approved: myExpenses.filter((e) => e.status === "approved").length,
    rejected: myExpenses.filter((e) => e.status === "rejected").length,
    totalAmount: myExpenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amountInCompanyCurrency, 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Expenses</h2>
          <p className="text-sm text-gray-500">{myExpenses.length} total expenses</p>
        </div>
        <button onClick={() => navigate("/employee/submit")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#d63384" }}>
          <PlusCircle size={15} /> New Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Receipt, color: "#d63384", bg: "#fce4ec" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "#d97706", bg: "#fef3c7" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "#059669", bg: "#d1fae5" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "#dc2626", bg: "#fee2e2" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "#fce7f3" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total reimbursed bar */}
      {stats.totalAmount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "linear-gradient(135deg, #d63384 0%, #9c1857 100%)" }}>
          <div>
            <p className="text-white/70 text-xs font-medium">Total Reimbursed</p>
            <p className="text-white font-bold text-xl">{sym}{stats.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-3" style={{ borderColor: "#fce7f3" }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your expenses..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
            onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
          onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
          onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#fce7f3" }}>
          <Receipt size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm mb-3">
            {myExpenses.length === 0 ? "You haven't submitted any expenses yet" : "No expenses match your filters"}
          </p>
          {myExpenses.length === 0 && (
            <button onClick={() => navigate("/employee/submit")} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#d63384" }}>
              Submit First Expense
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((expense) => (
            <div key={expense.id} onClick={() => navigate(`/expenses/${expense.id}`)}
              className="bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all flex items-center gap-4" style={{ borderColor: "#fce7f3" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fce4ec" }}>
                <Receipt size={18} style={{ color: "#d63384" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                  <StatusBadge status={expense.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {expense.category} · {new Date(expense.date).toLocaleDateString()}
                  {expense.approvals.length > 0 && (
                    <span> · Step {Math.min(expense.currentApproverStep + 1, expense.approvals.length)}/{expense.approvals.length}</span>
                  )}
                </p>
                {expense.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{expense.description}</p>
                )}
                {expense.status === "rejected" && expense.approvals.some((a) => a.status === "rejected" && a.comment) && (
                  <div className="mt-2 text-xs p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-100 flex items-start gap-1.5">
                    <XCircle size={14} className="flex-shrink-0 mt-0.5 text-red-500" />
                    <span>
                      <strong className="font-semibold text-red-800">Rejected: </strong>
                      {expense.approvals.find((a) => a.status === "rejected")?.comment}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{sym}{expense.amountInCompanyCurrency.toFixed(2)}</p>
                {expense.currency !== company?.currency && (
                  <p className="text-xs text-gray-400">{expense.currencySymbol}{expense.amount} {expense.currency}</p>
                )}
                {expense.receiptDataUrl && (
                  <p className="text-xs mt-0.5" style={{ color: "#d63384" }}>📎 receipt</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
