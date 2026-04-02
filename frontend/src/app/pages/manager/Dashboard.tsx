import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Clock, CheckCircle, XCircle, Users, ArrowRight, DollarSign } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatsCard } from "../../components/shared/StatsCard";
import { StatusBadge } from "../../components/shared/StatusBadge";

export function ManagerDashboard() {
  const { currentUser, company } = useAuth();
  const { getPendingForApprover, getTeamExpenses, users } = useApp();
  const navigate = useNavigate();

  const pending = useMemo(() => currentUser ? getPendingForApprover(currentUser.id) : [], [currentUser, getPendingForApprover]);
  const teamExpenses = useMemo(() => currentUser ? getTeamExpenses(currentUser.id) : [], [currentUser, getTeamExpenses]);
  const teamMembers = useMemo(() => users.filter((u) => u.managerId === currentUser?.id), [users, currentUser]);

  const approvedTotal = teamExpenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amountInCompanyCurrency, 0);
  const sym = company?.currencySymbol ?? "$";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Welcome back, {currentUser?.name?.split(" ")[0]}!</h2>
        <p className="text-sm text-gray-500">Here's your team's expense overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Pending Reviews" value={pending.length} subtitle="Awaiting your approval"
          icon={Clock} iconBg="#fef3c7" iconColor="#d97706" />
        <StatsCard title="Team Members" value={teamMembers.length} subtitle="Direct reports"
          icon={Users} iconBg="#ede9fe" iconColor="#7c3aed" />
        <StatsCard title="Approved" value={teamExpenses.filter(e=>e.status==="approved").length}
          subtitle="This period" icon={CheckCircle} iconBg="#d1fae5" iconColor="#059669" />
        <StatsCard title="Team Reimbursed" value={`${sym}${approvedTotal.toLocaleString(undefined, {maximumFractionDigits:0})}`}
          subtitle="Approved total" icon={DollarSign} />
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
          <div>
            <h3 className="font-semibold text-gray-900">Pending Approvals</h3>
            <p className="text-xs text-gray-400">Expenses waiting for your action</p>
          </div>
          {pending.length > 0 && (
            <button onClick={() => navigate("/manager/approvals")} className="text-xs font-medium flex items-center gap-1" style={{ color: "#d63384" }}>
              View all <ArrowRight size={12} />
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#fce7f3" }}>
            {pending.slice(0, 4).map((expense) => (
              <div key={expense.id} onClick={() => navigate(`/expenses/${expense.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-pink-50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "#d63384" }}>
                  {expense.employeeName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{expense.title}</p>
                  <p className="text-xs text-gray-500">{expense.employeeName} · {expense.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{sym}{expense.amountInCompanyCurrency.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Team Expenses */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
          <div>
            <h3 className="font-semibold text-gray-900">Team Expenses</h3>
            <p className="text-xs text-gray-400">Recent submissions from your team</p>
          </div>
          <button onClick={() => navigate("/manager/expenses")} className="text-xs font-medium flex items-center gap-1" style={{ color: "#d63384" }}>
            View all <ArrowRight size={12} />
          </button>
        </div>

        {teamExpenses.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400 text-sm">Your team hasn't submitted any expenses yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fdf2f8" }}>
                  {["Employee", "Expense", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamExpenses.slice(0, 5).map((e) => (
                  <tr key={e.id} onClick={() => navigate(`/expenses/${e.id}`)}
                    className="border-t cursor-pointer hover:bg-pink-50 transition-colors" style={{ borderColor: "#fce7f3" }}>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{e.employeeName}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-gray-800">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.category}</p>
                      {e.status === "rejected" && e.approvals.some((a) => a.status === "rejected" && a.comment) && (
                        <div className="mt-1.5 text-[11px] p-1.5 rounded-md bg-red-50 text-red-700 border border-red-100 flex items-start gap-1 max-w-[200px]">
                          <XCircle size={12} className="flex-shrink-0 mt-[1px] text-red-500" />
                          <span className="truncate">
                            <strong className="font-semibold text-red-800">Rejected: </strong>
                            {e.approvals.find((a) => a.status === "rejected")?.comment}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">{sym}{e.amountInCompanyCurrency.toFixed(2)}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
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
