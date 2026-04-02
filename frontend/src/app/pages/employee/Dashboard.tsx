import { useMemo } from "react";
import { useNavigate } from "react-router";
import { PlusCircle, Clock, CheckCircle, XCircle, ArrowRight, Receipt, DollarSign } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatsCard } from "../../components/shared/StatsCard";
import { StatusBadge } from "../../components/shared/StatusBadge";

export function EmployeeDashboard() {
  const { currentUser, company } = useAuth();
  const { getEmployeeExpenses } = useApp();
  const navigate = useNavigate();

  const myExpenses = useMemo(
    () => (currentUser ? getEmployeeExpenses(currentUser.id) : []),
    [currentUser, getEmployeeExpenses]
  );

  const pendingCount = myExpenses.filter((e) => e.status === "pending").length;
  const approvedCount = myExpenses.filter((e) => e.status === "approved").length;
  const rejectedCount = myExpenses.filter((e) => e.status === "rejected").length;
  const totalApproved = myExpenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amountInCompanyCurrency, 0);

  const sym = company?.currencySymbol ?? "$";
  const recent = [...myExpenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hello, {currentUser?.name?.split(" ")[0]}!</h2>
          <p className="text-sm text-gray-500">Manage and track your expense submissions</p>
        </div>
        <button
          onClick={() => navigate("/employee/submit")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ background: "#d63384" }}
        >
          <PlusCircle size={15} /> New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Submitted" value={myExpenses.length} subtitle="All time" icon={Receipt} />
        <StatsCard title="Pending" value={pendingCount} subtitle="Awaiting approval"
          icon={Clock} iconBg="#fef3c7" iconColor="#d97706" />
        <StatsCard title="Approved" value={approvedCount} subtitle={`${rejectedCount} rejected`}
          icon={CheckCircle} iconBg="#d1fae5" iconColor="#059669" />
        <StatsCard
          title="Total Reimbursed"
          value={`${sym}${totalApproved.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="Approved amount"
          icon={DollarSign}
          iconBg="#ede9fe" iconColor="#7c3aed"
        />
      </div>

      {/* Quick submit CTA */}
      {myExpenses.length === 0 && (
        <div
          onClick={() => navigate("/employee/submit")}
          className="flex items-center justify-between p-6 rounded-2xl cursor-pointer group"
          style={{ background: "linear-gradient(135deg, #d63384 0%, #9c1857 100%)" }}
        >
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Submit your first expense</h3>
            <p className="text-pink-200 text-sm">Upload a receipt or fill in details manually</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <ArrowRight size={20} className="text-white" />
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
          <div>
            <h3 className="font-semibold text-gray-900">Recent Expenses</h3>
            <p className="text-xs text-gray-400">Your latest submissions</p>
          </div>
          {myExpenses.length > 0 && (
            <button onClick={() => navigate("/employee/expenses")} className="text-xs font-medium flex items-center gap-1" style={{ color: "#d63384" }}>
              View all <ArrowRight size={12} />
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No expenses submitted yet</p>
            <button onClick={() => navigate("/employee/submit")} className="mt-3 text-sm font-medium" style={{ color: "#d63384" }}>
              Submit your first expense →
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#fce7f3" }}>
            {recent.map((expense) => (
              <div key={expense.id} onClick={() => navigate(`/expenses/${expense.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-pink-50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fce4ec" }}>
                  <Receipt size={16} style={{ color: "#d63384" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                  <p className="text-xs text-gray-500">{expense.category} · {new Date(expense.date).toLocaleDateString()}</p>
                  {expense.status === "rejected" && expense.approvals.some((a) => a.status === "rejected" && a.comment) && (
                    <div className="mt-1.5 text-xs p-2 rounded-lg bg-red-50 text-red-700 border border-red-100 flex items-start gap-1">
                      <XCircle size={13} className="flex-shrink-0 mt-0.5 text-red-500" />
                      <span className="truncate">
                        <strong className="font-semibold text-red-800">Rejected: </strong>
                        {expense.approvals.find((a) => a.status === "rejected")?.comment}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{sym}{expense.amountInCompanyCurrency.toFixed(2)}</p>
                  {expense.currency !== company?.currency && (
                    <p className="text-xs text-gray-400">{expense.currencySymbol}{expense.amount}</p>
                  )}
                </div>
                <StatusBadge status={expense.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending notices */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
          <Clock size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            You have <strong>{pendingCount} expense{pendingCount !== 1 ? "s" : ""}</strong> awaiting approval.
          </p>
          <button onClick={() => navigate("/employee/expenses")} className="ml-auto text-xs font-semibold text-amber-700 flex-shrink-0">
            View →
          </button>
        </div>
      )}
    </div>
  );
}
