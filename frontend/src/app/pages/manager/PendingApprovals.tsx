import { useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, XCircle, Eye, MessageSquare, X, Clock, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { toast } from "sonner";

export function PendingApprovalsPage() {
  const { currentUser, company } = useAuth();
  const { getPendingForApprover, approveExpense, rejectExpense } = useApp();
  const navigate = useNavigate();
  const [actionModal, setActionModal] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [comment, setComment] = useState("");

  if (!currentUser) return null;

  const pending = getPendingForApprover(currentUser.id);
  const sym = company?.currencySymbol ?? "$";

  const handleAction = async () => {
    if (!actionModal) return;
    if (actionModal.action === "reject" && !comment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    if (actionModal.action === "approve") {
      await approveExpense(actionModal.id, currentUser.id, comment);
      toast.success("Expense approved successfully");
    } else {
      await rejectExpense(actionModal.id, currentUser.id, comment);
      toast.success("Expense rejected");
    }
    setActionModal(null);
    setComment("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Pending Approvals</h2>
        <p className="text-sm text-gray-500">{pending.length} expense{pending.length !== 1 ? "s" : ""} waiting for your review</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center" style={{ borderColor: "#fce7f3" }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#d1fae5" }}>
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">All caught up!</h3>
          <p className="text-gray-400 text-sm">No expenses waiting for your approval</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((expense) => {
            const step = expense.approvals[expense.currentApproverStep];
            return (
              <div key={expense.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: "#d63384" }}>
                        {expense.employeeName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{expense.title}</h3>
                          <StatusBadge status={expense.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Submitted by <strong>{expense.employeeName}</strong> · {new Date(expense.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">{expense.category} · {expense.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900">{sym}{expense.amountInCompanyCurrency.toFixed(2)}</p>
                      {expense.currency !== company?.currency && (
                        <p className="text-xs text-gray-400">{expense.currencySymbol}{expense.amount} {expense.currency}</p>
                      )}
                    </div>
                  </div>

                  {/* Approval Steps */}
                  {expense.approvals.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "#fce7f3" }}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Approval Progress</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {expense.approvals.map((a, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              idx === expense.currentApproverStep ? "text-white" : ""
                            }`}
                              style={{
                                background:
                                  a.status === "approved" ? "#d1fae5" :
                                  a.status === "rejected" ? "#fee2e2" :
                                  idx === expense.currentApproverStep ? "#d63384" : "#f3f4f6",
                                color:
                                  a.status === "approved" ? "#059669" :
                                  a.status === "rejected" ? "#dc2626" :
                                  idx === expense.currentApproverStep ? "white" : "#6b7280",
                              }}>
                              {idx === expense.currentApproverStep && a.status === "pending" && <Clock size={11} />}
                              {a.status === "approved" && <CheckCircle size={11} />}
                              {a.status === "rejected" && <XCircle size={11} />}
                              {a.approverName}
                            </div>
                            {idx < expense.approvals.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Receipt preview */}
                  {expense.receiptDataUrl && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Receipt</p>
                      {expense.receiptDataUrl.toLowerCase().endsWith(".pdf") ? (
                        <button onClick={() => window.open(expense.receiptDataUrl)} className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors inline-flex">
                          <FileText size={14} /> Open PDF
                        </button>
                      ) : (
                        <img src={expense.receiptDataUrl} alt="Receipt" className="h-16 w-auto rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity" style={{ borderColor: "#fce7f3" }}
                          onClick={() => window.open(expense.receiptDataUrl)} />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: "#fce7f3" }}>
                    <button onClick={() => navigate(`/expenses/${expense.id}`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                      <Eye size={14} /> View Details
                    </button>
                    <button
                      onClick={() => { setActionModal({ id: expense.id, action: "approve" }); setComment(""); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold"
                      style={{ background: "#059669" }}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => { setActionModal({ id: expense.id, action: "reject" }); setComment(""); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: "#fee2e2", color: "#dc2626" }}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
              <h3 className="font-bold text-gray-900">
                {actionModal.action === "approve" ? "Approve Expense" : "Reject Expense"}
              </h3>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 text-sm ${
                actionModal.action === "approve" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                {actionModal.action === "approve"
                  ? <CheckCircle size={16} className="text-green-600" />
                  : <XCircle size={16} className="text-red-500" />}
                You are about to <strong>{actionModal.action}</strong> this expense.
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <MessageSquare size={13} className="inline mr-1" />
                  Comment {actionModal.action === "reject" ? "(required)" : "(optional)"}
                </label>
                <textarea
                  value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder={actionModal.action === "reject" ? "Provide reason for rejection..." : "Add a note (optional)..."}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg text-sm outline-none resize-none"
                  style={{ borderColor: "#e5e7eb" }}
                  onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setActionModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button onClick={handleAction}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: actionModal.action === "approve" ? "#059669" : "#dc2626" }}>
                  {actionModal.action === "approve" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {actionModal.action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
