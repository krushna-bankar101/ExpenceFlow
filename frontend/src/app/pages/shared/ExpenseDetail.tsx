import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Receipt, Calendar, Tag,
  FileText, DollarSign, User, X, MessageSquare, Eye, Shield, Scan
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { toast } from "sonner";

export function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, company } = useAuth();
  const { expenses, users, approveExpense, rejectExpense, adminOverrideExpense, getPendingForApprover } = useApp();
  const navigate = useNavigate();
  const [actionModal, setActionModal] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const expense = expenses.find((e) => e.id === id);

  if (!expense || !currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Receipt size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">Expense not found</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm font-medium" style={{ color: "#d63384" }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const sym = company?.currencySymbol ?? "$";
  const isMyExpense = expense.employeeId === currentUser.id;
  const currentApproval = expense.approvals[expense.currentApproverStep];
  const isCurrentApprover =
    currentUser.role !== "employee" &&
    expense.status === "pending" &&
    currentApproval?.approverId === currentUser.id;
  const isAdmin = currentUser.role === "admin";

  const submitter = users.find((u) => u.id === expense.employeeId);

  const handleApprove = async () => {
    await approveExpense(expense.id, currentUser.id, comment);
    toast.success("Expense approved!");
    setActionModal(null);
    setComment("");
  };

  const handleReject = async () => {
    if (!comment.trim()) { toast.error("Please provide a rejection reason"); return; }
    await rejectExpense(expense.id, currentUser.id, comment);
    toast.success("Expense rejected");
    setActionModal(null);
    setComment("");
  };

  const handleAdminOverride = async (action: "approve" | "reject") => {
    await adminOverrideExpense(expense.id, action, currentUser.id);
    toast.success(`Expense ${action}d via admin override`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        <div className="p-5 border-b" style={{ borderColor: "#fce7f3", background: "#fdf2f8" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{expense.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Submitted by <strong>{expense.employeeName}</strong></p>
            </div>
            <StatusBadge status={expense.status} />
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="flex items-start gap-2.5">
              <DollarSign size={16} style={{ color: "#d63384" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Amount</p>
                <p className="text-base font-bold text-gray-900">{sym}{expense.amountInCompanyCurrency.toFixed(2)}</p>
                {expense.currency !== company?.currency && (
                  <p className="text-xs text-gray-400">{expense.currencySymbol}{expense.amount} {expense.currency}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Tag size={15} style={{ color: "#d63384" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Category</p>
                <p className="text-sm font-semibold text-gray-800">{expense.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar size={15} style={{ color: "#d63384" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Date</p>
                <p className="text-sm font-semibold text-gray-800">{new Date(expense.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <User size={15} style={{ color: "#d63384" }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Submitted</p>
                <p className="text-sm font-semibold text-gray-800">{new Date(expense.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {expense.description && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={14} style={{ color: "#d63384" }} />
                <p className="text-sm font-semibold text-gray-700">Description</p>
              </div>
              <p className="text-sm text-gray-600 pl-6 leading-relaxed">{expense.description}</p>
            </div>
          )}

          {/* Currency conversion info */}
          {expense.currency !== company?.currency && (
            <div className="p-3 rounded-lg text-xs mb-4" style={{ background: "#fdf2f8" }}>
              <span className="font-semibold" style={{ color: "#d63384" }}>Currency: </span>
              <span className="text-gray-600">
                {expense.currencySymbol}{expense.amount} {expense.currency} × {expense.exchangeRate.toFixed(4)} = {sym}{expense.amountInCompanyCurrency.toFixed(2)} {company?.currency}
              </span>
            </div>
          )}

          {/* Receipt */}
          {expense.receiptDataUrl && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt size={14} style={{ color: "#d63384" }} />
                <p className="text-sm font-semibold text-gray-700">Receipt</p>
                {expense.ocrData && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#d1fae5", color: "#059669" }}>
                    <Scan size={10} /> OCR Scanned
                  </span>
                )}
              </div>
              <div className="pl-6">
                {expense.receiptDataUrl.toLowerCase().endsWith(".pdf") ? (
                  <button onClick={() => window.open(expense.receiptDataUrl)} className="mt-1 text-sm font-semibold flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors">
                    <FileText size={16} /> Open PDF Receipt
                  </button>
                ) : (
                  <>
                    <img
                      src={expense.receiptDataUrl}
                      alt="Receipt"
                      className="max-h-32 rounded-lg border cursor-pointer object-contain hover:opacity-90 transition-opacity"
                      style={{ borderColor: "#fce7f3" }}
                      onClick={() => setShowReceiptModal(true)}
                    />
                    <button onClick={() => setShowReceiptModal(true)} className="mt-1 text-xs flex items-center gap-1" style={{ color: "#d63384" }}>
                      <Eye size={11} /> View full receipt
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Admin Override Badge */}
          {expense.adminOverrideBy && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs" style={{ background: "#ede9fe" }}>
              <Shield size={13} className="text-purple-600" />
              <span className="text-purple-700 font-medium">This expense was overridden by an administrator</span>
            </div>
          )}
        </div>
      </div>

      {/* Approval Timeline */}
      {expense.approvals.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
          <div className="p-4 border-b" style={{ borderColor: "#fce7f3", background: "#fdf2f8" }}>
            <h3 className="font-semibold text-gray-900 text-sm">Approval Timeline</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {expense.status === "pending"
                ? `Step ${expense.currentApproverStep + 1} of ${expense.approvals.length}`
                : expense.status === "approved" ? "All approved" : "Rejected"}
            </p>
          </div>

          <div className="p-5">
            <div className="space-y-4">
              {expense.approvals.map((approval, idx) => {
                const isActive = idx === expense.currentApproverStep && expense.status === "pending";
                const isDone = approval.status !== "pending";

                return (
                  <div key={idx} className="flex gap-4">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          background:
                            approval.status === "approved" ? "#d1fae5" :
                            approval.status === "rejected" ? "#fee2e2" :
                            isActive ? "#d63384" : "#f3f4f6",
                          color:
                            approval.status === "approved" ? "#059669" :
                            approval.status === "rejected" ? "#dc2626" :
                            isActive ? "white" : "#9ca3af",
                        }}
                      >
                        {approval.status === "approved" ? <CheckCircle size={14} /> :
                         approval.status === "rejected" ? <XCircle size={14} /> :
                         approval.status === "skipped" ? "—" :
                         isActive ? <Clock size={14} /> : idx + 1}
                      </div>
                      {idx < expense.approvals.length - 1 && (
                        <div className="w-0.5 h-8 mt-1" style={{ background: isDone ? "#fce7f3" : "#e5e7eb" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{approval.approverName}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background:
                              approval.status === "approved" ? "#d1fae5" :
                              approval.status === "rejected" ? "#fee2e2" :
                              approval.status === "skipped" ? "#e0e7ff" :
                              isActive ? "#fce4ec" : "#f3f4f6",
                            color:
                              approval.status === "approved" ? "#059669" :
                              approval.status === "rejected" ? "#dc2626" :
                              approval.status === "skipped" ? "#6366f1" :
                              isActive ? "#d63384" : "#6b7280",
                          }}
                        >
                          {isActive && approval.status === "pending" ? "Waiting" :
                           approval.status === "pending" ? "Not reached" :
                           approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                        {isActive && (
                          <span className="text-xs text-gray-400">· Awaiting action</span>
                        )}
                      </div>

                      {approval.timestamp && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(approval.timestamp).toLocaleString()}
                        </p>
                      )}

                      {approval.comment && (
                        <div className="mt-2 p-2.5 rounded-lg text-xs flex items-start gap-1.5" style={{ background: "#f9fafb" }}>
                          <MessageSquare size={11} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 italic">"{approval.comment}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OCR Data */}
      {expense.ocrData && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "#fce7f3", background: "#fdf2f8" }}>
            <Scan size={14} style={{ color: "#d63384" }} />
            <h3 className="font-semibold text-gray-900 text-sm">OCR Extracted Data</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {expense.ocrData.merchantName && (
                <div className="text-xs">
                  <p className="font-semibold text-gray-500 mb-0.5">Merchant</p>
                  <p className="text-gray-800">{expense.ocrData.merchantName}</p>
                </div>
              )}
              {expense.ocrData.amount && (
                <div className="text-xs">
                  <p className="font-semibold text-gray-500 mb-0.5">Detected Amount</p>
                  <p className="text-gray-800">{expense.ocrData.amount}</p>
                </div>
              )}
              {expense.ocrData.date && (
                <div className="text-xs">
                  <p className="font-semibold text-gray-500 mb-0.5">Detected Date</p>
                  <p className="text-gray-800">{expense.ocrData.date}</p>
                </div>
              )}
            </div>
            {expense.ocrData.rawText && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600 font-medium">View raw OCR text</summary>
                <pre className="mt-2 p-3 rounded-lg bg-gray-50 text-gray-600 whitespace-pre-wrap text-xs overflow-x-auto max-h-32">
                  {expense.ocrData.rawText}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(isCurrentApprover || (isAdmin && expense.status === "pending")) && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#fce7f3" }}>
          <h3 className="font-semibold text-gray-900 mb-3">
            {isCurrentApprover ? "Your Action Required" : "Admin Override"}
          </h3>
          {isAdmin && !isCurrentApprover && expense.status === "pending" && (
            <p className="text-xs text-gray-500 mb-3">As admin, you can override the approval workflow</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setActionModal("approve"); setComment(""); }}
              className="flex-1 py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: "#059669" }}
            >
              <CheckCircle size={15} /> Approve
            </button>
            <button
              onClick={() => { setActionModal("reject"); setComment(""); }}
              className="flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: "#fee2e2", color: "#dc2626" }}
            >
              <XCircle size={15} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#fce7f3" }}>
              <h3 className="font-bold text-gray-900">
                {actionModal === "approve" ? "Approve Expense" : "Reject Expense"}
              </h3>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className={`p-3 rounded-lg mb-4 text-sm flex items-center gap-2 ${
                actionModal === "approve" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                {actionModal === "approve"
                  ? <CheckCircle size={15} className="text-green-500" />
                  : <XCircle size={15} className="text-red-500" />}
                <strong>{expense.title}</strong> — {sym}{expense.amountInCompanyCurrency.toFixed(2)}
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Comment {actionModal === "reject" ? "(required)" : "(optional)"}
              </label>
              <textarea
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder={actionModal === "reject" ? "Explain the reason for rejection..." : "Add a note (optional)..."}
                rows={3}
                className="w-full px-4 py-3 border rounded-lg text-sm outline-none resize-none"
                style={{ borderColor: "#e5e7eb" }}
                onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />

              <div className="flex gap-3 mt-4">
                <button onClick={() => setActionModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button
                  onClick={actionModal === "approve" ? handleApprove : handleReject}
                  className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold"
                  style={{ background: actionModal === "approve" ? "#059669" : "#dc2626" }}
                >
                  Confirm {actionModal === "approve" ? "Approval" : "Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Full View Modal */}
      {showReceiptModal && expense.receiptDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowReceiptModal(false)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowReceiptModal(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X size={24} />
            </button>
            {!expense.receiptDataUrl.toLowerCase().endsWith(".pdf") && (
              <img src={expense.receiptDataUrl} alt="Receipt" className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
