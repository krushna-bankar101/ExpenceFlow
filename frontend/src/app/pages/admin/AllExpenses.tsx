import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, CheckCircle, XCircle, Eye } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EXPENSE_CATEGORIES } from "../../utils/countries";
import { toast } from "sonner";

export function AdminExpensesPage() {
  const { currentUser, company } = useAuth();
  const { expenses, adminOverrideExpense } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchSearch =
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || e.status === statusFilter;
        const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
        return matchSearch && matchStatus && matchCategory;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [expenses, search, statusFilter, categoryFilter]);

  const handleOverride = async (expenseId: string, action: "approve" | "reject", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await adminOverrideExpense(expenseId, action, currentUser.id);
    toast.success(`Expense ${action}d by admin override`);
  };

  const totals = useMemo(() => {
    const pending = expenses.filter((e) => e.status === "pending").reduce((s, e) => s + e.amountInCompanyCurrency, 0);
    const approved = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amountInCompanyCurrency, 0);
    const rejected = expenses.filter((e) => e.status === "rejected").reduce((s, e) => s + e.amountInCompanyCurrency, 0);
    return { pending, approved, rejected };
  }, [expenses]);

  const sym = company?.currencySymbol ?? "$";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">All Expenses</h2>
        <p className="text-sm text-gray-500">Company-wide expense overview with admin override controls</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", amount: totals.pending, color: "#d97706", bg: "#fef3c7", count: expenses.filter(e=>e.status==="pending").length },
          { label: "Approved", amount: totals.approved, color: "#059669", bg: "#d1fae5", count: expenses.filter(e=>e.status==="approved").length },
          { label: "Rejected", amount: totals.rejected, color: "#dc2626", bg: "#fee2e2", count: expenses.filter(e=>e.status==="rejected").length },
        ].map(({ label, amount, color, bg, count }) => (
          <div key={label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#fce7f3" }}>
            <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">{sym}{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: bg, color }}>{count} expense{count !== 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "#fce7f3" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses, employees..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
              onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Filter size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No expenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fdf2f8" }}>
                  {["Employee", "Expense", "Amount", "Category", "Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id} className="border-t hover:bg-pink-50 transition-colors cursor-pointer" style={{ borderColor: "#fce7f3" }}
                    onClick={() => navigate(`/expenses/${expense.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#d63384" }}>
                          {expense.employeeName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{expense.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{expense.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-32">{expense.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900">{sym}{expense.amountInCompanyCurrency.toFixed(2)}</p>
                      {expense.currency !== company?.currency && (
                        <p className="text-xs text-gray-400">{expense.currencySymbol}{expense.amount} {expense.currency}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#fdf2f8", color: "#d63384" }}>{expense.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={expense.status} />
                      {expense.adminOverrideBy && (
                        <p className="text-xs text-gray-400 mt-0.5">Admin override</p>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/expenses/${expense.id}`); }}
                          className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        {expense.status === "pending" && (
                          <>
                            <button onClick={(e) => handleOverride(expense.id, "approve", e)}
                              className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Override Approve">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={(e) => handleOverride(expense.id, "reject", e)}
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Override Reject">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
