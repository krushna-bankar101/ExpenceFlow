import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Users, Receipt, CheckCircle, Clock, XCircle, TrendingUp,
  ArrowRight, AlertTriangle, DollarSign
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatsCard } from "../../components/shared/StatsCard";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AdminDashboard() {
  const { company } = useAuth();
  const { users, expenses } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const pending = expenses.filter((e) => e.status === "pending").length;
    const approved = expenses.filter((e) => e.status === "approved").length;
    const rejected = expenses.filter((e) => e.status === "rejected").length;
    const totalAmount = expenses
      .filter((e) => e.status === "approved")
      .reduce((s, e) => s + e.amountInCompanyCurrency, 0);
    return { pending, approved, rejected, totalAmount, total: expenses.length };
  }, [expenses]);

  const employees = users.filter((u) => u.role === "employee").length;
  const managers = users.filter((u) => u.role === "manager").length;

  // Build monthly chart data
  const chartData = useMemo(() => {
    const months: Record<string, { month: string; amount: number; count: number }> = {};
    expenses.forEach((e) => {
      const d = new Date(e.createdAt);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!months[key]) months[key] = { month: key, amount: 0, count: 0 };
      months[key].amount += e.amountInCompanyCurrency;
      months[key].count += 1;
    });
    return Object.values(months).slice(-6);
  }, [expenses]);

  const recentExpenses = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={users.length}
          subtitle={`${employees} employees · ${managers} managers`}
          icon={Users}
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pending}
          subtitle="Awaiting review"
          icon={Clock}
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
        <StatsCard
          title="Approved Expenses"
          value={stats.approved}
          subtitle={`${stats.rejected} rejected`}
          icon={CheckCircle}
          iconBg="#d1fae5"
          iconColor="#059669"
        />
        <StatsCard
          title="Total Reimbursed"
          value={`${company?.currencySymbol}${stats.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="Approved amount"
          icon={DollarSign}
          iconBg="#ede9fe"
          iconColor="#7c3aed"
        />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5" style={{ borderColor: "#fce7f3" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Expense Trends</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly expense volume</p>
            </div>
            <TrendingUp size={18} style={{ color: "#d63384" }} />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d63384" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#d63384" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "none", borderRadius: 8, boxShadow: "0 4px 20px rgba(214,51,132,0.1)", fontSize: 12 }}
                  formatter={(val: number) => [`${company?.currencySymbol}${val.toFixed(0)}`, "Amount"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#d63384" strokeWidth={2} fill="url(#pinkGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-gray-400 text-sm">No expense data yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#fce7f3" }}>
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Manage Users", desc: "Add employees & managers", path: "/admin/users", color: "#d63384" },
              { label: "Approval Rules", desc: "Configure workflows", path: "/admin/approval-rules", color: "#7c3aed" },
              { label: "View All Expenses", desc: "Review & override", path: "/admin/expenses", color: "#059669" },
            ].map(({ label, desc, path, color }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full text-left p-3 rounded-lg border hover:shadow-sm transition-all flex items-center justify-between group"
                style={{ borderColor: "#fce7f3" }}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRight size={14} style={{ color }} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>

          {/* Status breakdown */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#fce7f3" }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Overview</p>
            {[
              { label: "Pending", count: stats.pending, color: "#d97706", bg: "#fef3c7" },
              { label: "Approved", count: stats.approved, color: "#059669", bg: "#d1fae5" },
              { label: "Rejected", count: stats.rejected, color: "#dc2626", bg: "#fee2e2" },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
          <div>
            <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
            <p className="text-xs text-gray-400">Latest submissions across all employees</p>
          </div>
          <button
            onClick={() => navigate("/admin/expenses")}
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: "#d63384" }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No expenses submitted yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fdf2f8" }}>
                  {["Employee", "Title", "Amount", "Category", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/expenses/${e.id}`)}
                    className="border-t cursor-pointer hover:bg-pink-50 transition-colors"
                    style={{ borderColor: "#fce7f3" }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#d63384" }}>
                          {e.employeeName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-800 font-medium">{e.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{e.title}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {company?.currencySymbol}{e.amountInCompanyCurrency.toFixed(2)}
                        </p>
                        {e.currency !== company?.currency && (
                          <p className="text-xs text-gray-400">
                            {e.currencySymbol}{e.amount} {e.currency}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#fdf2f8", color: "#d63384" }}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alerts */}
      {stats.pending > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{stats.pending} expense{stats.pending !== 1 ? "s" : ""}</strong> pending approval. Review them to keep the process moving.
          </p>
          <button
            onClick={() => navigate("/admin/expenses")}
            className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 flex-shrink-0"
          >
            Review <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
