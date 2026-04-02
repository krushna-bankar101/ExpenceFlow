import { useState, useMemo } from "react";
import {
  Plus, X, Check, Edit2, Trash2, ChevronUp, ChevronDown,
  Settings, ToggleLeft, ToggleRight, Info
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import type { ApprovalRule, ApproverStep, ConditionalRule } from "../../store/data";
import { EXPENSE_CATEGORIES } from "../../utils/countries";
import { toast } from "sonner";

type ConditionalType = "none" | "percentage" | "specific" | "hybrid";

interface RuleForm {
  name: string;
  description: string;
  isManagerApproverFirst: boolean;
  approvers: ApproverStep[];
  conditionalType: ConditionalType;
  percentage: string;
  specificApproverId: string;
  minAmount: string;
  maxAmount: string;
  categories: string[];
}

const emptyForm: RuleForm = {
  name: "", description: "", isManagerApproverFirst: false,
  approvers: [], conditionalType: "none",
  percentage: "60", specificApproverId: "",
  minAmount: "", maxAmount: "", categories: [],
};

export function ApprovalRulesPage() {
  const { company } = useAuth();
  const { users, approvalRules, addApprovalRule, updateApprovalRule, removeApprovalRule } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState<ApprovalRule | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [approverSearch, setApproverSearch] = useState("");

  const eligibleApprovers = useMemo(
    () => users.filter((u) => u.role === "manager" || u.role === "admin"),
    [users]
  );

  const filteredApprovers = eligibleApprovers.filter(
    (u) =>
      !form.approvers.find((a) => a.userId === u.id) &&
      u.name.toLowerCase().includes(approverSearch.toLowerCase())
  );

  const openCreate = () => {
    setEditRule(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (rule: ApprovalRule) => {
    setEditRule(rule);
    const ctype: ConditionalType = rule.conditionalRule?.type ?? "none";
    setForm({
      name: rule.name,
      description: rule.description ?? "",
      isManagerApproverFirst: rule.isManagerApproverFirst,
      approvers: rule.approvers,
      conditionalType: ctype === "none" ? "none" : ctype,
      percentage: rule.conditionalRule?.percentage?.toString() ?? "60",
      specificApproverId: rule.conditionalRule?.specificApproverId ?? "",
      minAmount: rule.minAmount?.toString() ?? "",
      maxAmount: rule.maxAmount?.toString() ?? "",
      categories: rule.categories ?? [],
    });
    setShowModal(true);
  };

  const addApprover = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setForm((f) => ({
      ...f,
      approvers: [
        ...f.approvers,
        { order: f.approvers.length, userId: user.id, userName: user.name, userRole: user.role },
      ],
    }));
    setApproverSearch("");
  };

  const removeApprover = (userId: string) => {
    setForm((f) => ({
      ...f,
      approvers: f.approvers.filter((a) => a.userId !== userId).map((a, i) => ({ ...a, order: i })),
    }));
  };

  const moveApprover = (idx: number, dir: "up" | "down") => {
    setForm((f) => {
      const arr = [...f.approvers];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= arr.length) return f;
      [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
      return { ...f, approvers: arr.map((a, i) => ({ ...a, order: i })) };
    });
  };

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Rule name is required"); return; }

    let conditionalRule: ConditionalRule | undefined;
    if (form.conditionalType !== "none") {
      if (form.conditionalType === "percentage" || form.conditionalType === "hybrid") {
        const pct = parseFloat(form.percentage);
        if (isNaN(pct) || pct < 1 || pct > 100) { toast.error("Percentage must be between 1 and 100"); return; }
      }
      conditionalRule = {
        type: form.conditionalType as "percentage" | "specific" | "hybrid",
        percentage:
          form.conditionalType === "percentage" || form.conditionalType === "hybrid"
            ? parseFloat(form.percentage)
            : undefined,
        specificApproverId: form.conditionalType === "specific" || form.conditionalType === "hybrid"
          ? form.specificApproverId || undefined
          : undefined,
        specificApproverName: form.specificApproverId
          ? users.find((u) => u.id === form.specificApproverId)?.name
          : undefined,
      };
    }

    const ruleData = {
      companyId: company!.id,
      name: form.name,
      description: form.description || undefined,
      isActive: true,
      isManagerApproverFirst: form.isManagerApproverFirst,
      approvers: form.approvers,
      conditionalRule,
      minAmount: form.minAmount ? parseFloat(form.minAmount) : undefined,
      maxAmount: form.maxAmount ? parseFloat(form.maxAmount) : undefined,
      categories: form.categories.length > 0 ? form.categories : undefined,
    };

    if (editRule) {
      await updateApprovalRule(editRule.id, ruleData);
      toast.success("Approval rule updated");
    } else {
      await addApprovalRule(ruleData);
      toast.success("Approval rule created");
    }
    setShowModal(false);
  };

  const handleToggleActive = async (rule: ApprovalRule) => {
    await updateApprovalRule(rule.id, { isActive: !rule.isActive });
    toast.success(rule.isActive ? "Rule deactivated" : "Rule activated");
  };

  const handleDelete = async (id: string) => {
    await removeApprovalRule(id);
    setDeleteConfirm(null);
    toast.success("Rule deleted");
  };

  const conditionalLabels: Record<ConditionalType, string> = {
    none: "Sequential Only",
    percentage: "Percentage Rule",
    specific: "Specific Approver",
    hybrid: "Hybrid (% OR Specific)",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Approval Rules</h2>
          <p className="text-sm text-gray-500">Configure multi-level expense approval workflows</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#d63384" }}>
          <Plus size={15} /> New Rule
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: "#fdf2f8", borderColor: "#f9a8d4" }}>
        <Info size={16} style={{ color: "#d63384" }} className="flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <strong className="text-gray-800">How rules work:</strong> Rules are matched by amount and category. 
          The most specific matching rule applies. If no rule matches, expenses are auto-approved.
          If "Manager First" is enabled, the employee's assigned manager approves before other approvers.
        </div>
      </div>

      {/* Rules List */}
      {approvalRules.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "#fce7f3" }}>
          <Settings size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium mb-1">No approval rules yet</p>
          <p className="text-gray-400 text-sm mb-4">Create rules to define how expenses are approved</p>
          <button onClick={openCreate} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#d63384" }}>
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {approvalRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${rule.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                      {rule.conditionalRule && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                          {conditionalLabels[rule.conditionalRule.type]}
                        </span>
                      )}
                    </div>
                    {rule.description && <p className="text-sm text-gray-500 mt-1">{rule.description}</p>}

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rule.isManagerApproverFirst && (
                        <span className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: "#f9a8d4", color: "#d63384", background: "#fdf2f8" }}>
                          Manager First
                        </span>
                      )}
                      {rule.minAmount != null && (
                        <span className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                          Min: {company?.currencySymbol}{rule.minAmount}
                        </span>
                      )}
                      {rule.maxAmount != null && (
                        <span className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                          Max: {company?.currencySymbol}{rule.maxAmount}
                        </span>
                      )}
                      {rule.categories?.map((c) => (
                        <span key={c} className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggleActive(rule)} className="p-1.5 rounded text-gray-400 hover:text-gray-600">
                      {rule.isActive ? <ToggleRight size={18} style={{ color: "#d63384" }} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(rule)} className="p-1.5 rounded hover:bg-pink-50 text-gray-400 hover:text-pink-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(rule.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Approver sequence */}
                {rule.approvers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Approval Sequence</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {rule.isManagerApproverFirst && (
                        <>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#fdf2f8", color: "#d63384", border: "1px solid #f9a8d4" }}>
                            <span className="w-4 h-4 rounded-full bg-pink-200 flex items-center justify-center text-xs font-bold" style={{ color: "#d63384" }}>M</span>
                            Manager (auto)
                          </div>
                          <span className="text-gray-300">→</span>
                        </>
                      )}
                      {rule.approvers.map((a, idx) => (
                        <div key={a.userId} className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#d63384" }}>
                              {idx + (rule.isManagerApproverFirst ? 2 : 1)}
                            </span>
                            {a.userName}
                          </div>
                          {idx < rule.approvers.length - 1 && <span className="text-gray-300">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditional rule details */}
                {rule.conditionalRule && (
                  <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                    <span className="font-semibold text-purple-700">Conditional: </span>
                    {rule.conditionalRule.type === "percentage" && (
                      <span className="text-purple-600">
                        Auto-approve when {rule.conditionalRule.percentage}% of approvers have approved
                      </span>
                    )}
                    {rule.conditionalRule.type === "specific" && (
                      <span className="text-purple-600">
                        Auto-approve when {rule.conditionalRule.specificApproverName || "specific approver"} approves
                      </span>
                    )}
                    {rule.conditionalRule.type === "hybrid" && (
                      <span className="text-purple-600">
                        Auto-approve when {rule.conditionalRule.percentage}% approve OR {rule.conditionalRule.specificApproverName || "specific approver"} approves
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Delete Rule?</h3>
            <p className="text-sm text-gray-500 mb-6">This approval rule will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: "#fce7f3" }}>
              <h3 className="font-bold text-gray-900">{editRule ? "Edit Rule" : "New Approval Rule"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-5 space-y-5">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rule Name *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Standard Approval, High-Value Review"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description of this rule..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                </div>

                {/* Manager First Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "#fdf2f8" }}>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Is Manager Approver First</p>
                    <p className="text-xs text-gray-500 mt-0.5">Employee's assigned manager approves before the sequence</p>
                  </div>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, isManagerApproverFirst: !f.isManagerApproverFirst }))}
                    className="flex items-center gap-1">
                    {form.isManagerApproverFirst
                      ? <ToggleRight size={28} style={{ color: "#d63384" }} />
                      : <ToggleLeft size={28} className="text-gray-300" />}
                  </button>
                </div>

                {/* Approval Sequence */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Approval Sequence</label>
                  {form.approvers.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {form.approvers.map((a, idx) => (
                        <div key={a.userId} className="flex items-center gap-2 p-2.5 rounded-lg border bg-gray-50" style={{ borderColor: "#e5e7eb" }}>
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#d63384" }}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{a.userName}</p>
                            <p className="text-xs text-gray-400 capitalize">{a.userRole}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => moveApprover(idx, "up")} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                              <ChevronUp size={14} />
                            </button>
                            <button type="button" onClick={() => moveApprover(idx, "down")} disabled={idx === form.approvers.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                              <ChevronDown size={14} />
                            </button>
                            <button type="button" onClick={() => removeApprover(a.userId)} className="p-1 text-gray-400 hover:text-red-500">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input type="text" value={approverSearch} onChange={(e) => setApproverSearch(e.target.value)}
                      placeholder="Search and add approvers..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none"
                      onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => setTimeout(() => (e.target.style.borderColor = "#e5e7eb"), 150)} />
                    {approverSearch && filteredApprovers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                        {filteredApprovers.map((u) => (
                          <button key={u.id} type="button" onClick={() => addApprover(u.id)}
                            className="w-full text-left px-4 py-2.5 hover:bg-pink-50 flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-800">{u.name}</span>
                            <span className="text-xs text-gray-400 capitalize">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {eligibleApprovers.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">Create manager or admin users first to add approvers.</p>
                  )}
                </div>

                {/* Conditional Rule */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Conditional Rule</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["none", "percentage", "specific", "hybrid"] as ConditionalType[]).map((t) => (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, conditionalType: t }))}
                        className="px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left"
                        style={{
                          background: form.conditionalType === t ? "#d63384" : "#fdf2f8",
                          color: form.conditionalType === t ? "white" : "#9c4070",
                          borderColor: form.conditionalType === t ? "#d63384" : "#f9a8d4",
                        }}>
                        {conditionalLabels[t]}
                      </button>
                    ))}
                  </div>

                  {(form.conditionalType === "percentage" || form.conditionalType === "hybrid") && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Approval Percentage (%)</label>
                      <input type="number" min="1" max="100" value={form.percentage}
                        onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                        onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                      <p className="text-xs text-gray-400 mt-1">If {form.percentage}% of approvers approve, expense is auto-approved</p>
                    </div>
                  )}

                  {(form.conditionalType === "specific" || form.conditionalType === "hybrid") && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Specific Approver</label>
                      <select value={form.specificApproverId} onChange={(e) => setForm((f) => ({ ...f, specificApproverId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                        onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}>
                        <option value="">— Select Approver —</option>
                        {form.approvers.map((a) => (
                          <option key={a.userId} value={a.userId}>{a.userName}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">If this person approves, expense is auto-approved regardless of sequence</p>
                    </div>
                  )}
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount Range ({company?.currency}) <span className="font-normal text-gray-400">— Optional filter</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Min Amount</label>
                      <input type="number" min="0" value={form.minAmount} onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                        onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Max Amount</label>
                      <input type="number" min="0" value={form.maxAmount} onChange={(e) => setForm((f) => ({ ...f, maxAmount: e.target.value }))}
                        placeholder="No limit"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none"
                        onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categories <span className="font-normal text-gray-400">— Leave empty for all</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                        style={{
                          background: form.categories.includes(cat) ? "#d63384" : "#fdf2f8",
                          color: form.categories.includes(cat) ? "white" : "#9c4070",
                          borderColor: form.categories.includes(cat) ? "#d63384" : "#f9a8d4",
                        }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t flex-shrink-0" style={{ borderColor: "#fce7f3" }}>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "#d63384" }}>
                  <Check size={15} /> {editRule ? "Save Changes" : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
