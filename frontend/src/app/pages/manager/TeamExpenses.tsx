import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Search, Users, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EXPENSE_CATEGORIES } from "../../utils/countries";

export function TeamExpensesPage() {
  const { currentUser, company } = useAuth();
  const { getTeamExpenses, users } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  if (!currentUser) return null;

  const teamMembers = users.filter((u) => u.managerId === currentUser.id);
  const teamExpenses = getTeamExpenses(currentUser.id);
  const sym = company?.currencySymbol ?? "$";

  const filtered = useMemo(() => {
    return teamExpenses
      .filter((e) => {
        const matchSearch =
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.employeeName.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || e.status === statusFilter;
        const matchMember = memberFilter === "all" || e.employeeId === memberFilter;
        return matchSearch && matchStatus && matchMember;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [teamExpenses, search, statusFilter, memberFilter]);

  const totalApproved = teamExpenses.filter(e=>e.status==="approved").reduce((s,e)=>s+e.amountInCompanyCurrency, 0);
  const totalPending = teamExpenses.filter(e=>e.status==="pending").reduce((s,e)=>s+e.amountInCompanyCurrency, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Team Expenses</h2>
        <p className="text-sm text-gray-500">{teamMembers.length} team member{teamMembers.length!==1?"s":""} · {teamExpenses.length} total expenses</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Expenses", value: teamExpenses.length, subLabel: "submitted" },
          { label: "Pending", value: teamExpenses.filter(e=>e.status==="pending").length, subLabel: `${sym}${totalPending.toFixed(0)}` },
          { label: "Approved", value: teamExpenses.filter(e=>e.status==="approved").length, subLabel: `${sym}${totalApproved.toFixed(0)}` },
          { label: "Rejected", value: teamExpenses.filter(e=>e.status==="rejected").length, subLabel: "declined" },
        ].map(({ label, value, subLabel }) => (
          <div key={label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#fce7f3" }}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{subLabel}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-3" style={{ borderColor: "#fce7f3" }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses or employees..."
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
        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
          onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
          <option value="all">All Members</option>
          {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Team Members Row */}
      {teamMembers.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {teamMembers.map((member) => {
            const memberExpenses = teamExpenses.filter((e) => e.employeeId === member.id);
            return (
              <div key={member.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border" style={{ borderColor: "#fce7f3" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#d63384" }}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{member.name}</p>
                  <p className="text-xs text-gray-400">{memberExpenses.length} expenses</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 text-sm">{teamExpenses.length === 0 ? "Your team hasn't submitted any expenses" : "No expenses match your filters"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "#fdf2f8" }}>
                  {["Employee", "Expense", "Amount", "Category", "Date", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} onClick={() => navigate(`/expenses/${e.id}`)}
                    className="border-t cursor-pointer hover:bg-pink-50 transition-colors" style={{ borderColor: "#fce7f3" }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#d63384" }}>
                          {e.employeeName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{e.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">{e.title}</p>
                      <p className="text-xs text-gray-400 max-w-36 truncate">{e.description}</p>
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
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-gray-900">{sym}{e.amountInCompanyCurrency.toFixed(2)}</p>
                      {e.currency !== company?.currency && (
                        <p className="text-xs text-gray-400">{e.currencySymbol}{e.amount} {e.currency}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#fdf2f8", color: "#d63384" }}>{e.category}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
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
