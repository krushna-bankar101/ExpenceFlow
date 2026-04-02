import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Upload, Loader2, X, CheckCircle, DollarSign,
  Calendar, Tag, FileText, AlertCircle, Scan, RotateCcw, ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { EXPENSE_CATEGORIES, ALL_CURRENCIES, convertCurrency } from "../../utils/countries";
import { processReceiptOCR } from "../../utils/ocr";
import type { OCRProgress } from "../../utils/ocr";
import { toast } from "sonner";
import { apiUploadReceipt } from "../../store/data";

interface FormData {
  title: string;
  amount: string;
  currency: string;
  currencySymbol: string;
  category: string;
  description: string;
  date: string;
}

const today = new Date().toISOString().split("T")[0];

export function SubmitExpensePage() {
  const { currentUser, company } = useAuth();
  const { submitExpense } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    title: "", amount: "", currency: company?.currency ?? "USD",
    currencySymbol: company?.currencySymbol ?? "$",
    category: "", description: "", date: today,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrProgress, setOCRProgress] = useState<OCRProgress | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const selectCurrency = (c: { code: string; symbol: string; name: string }) => {
    setForm((f) => ({ ...f, currency: c.code, currencySymbol: c.symbol }));
    setShowCurrencyDropdown(false);
    setCurrencySearch("");
  };

  const handleFileSelect = async (file: File) => {
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Please select a file less than 5 MB");
      return;
    }
    setReceiptFile(file);


    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setReceiptPreview(dataUrl);
      setReceiptDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runOCR = async () => {
    if (!receiptFile) return;
    setIsOCRProcessing(true);
    setOCRProgress(null);
    try {
      const result = await processReceiptOCR(receiptFile, (p) => setOCRProgress(p));
      setOcrData(result);


      const updates: Partial<FormData> = {};
      if (result.merchantName && !form.title) updates.title = result.merchantName.substring(0, 60);
      if (result.amount) updates.amount = result.amount.toFixed(2);
      if (result.date) updates.date = result.date;
      if (result.description && !form.description) updates.description = result.description;

      setForm((f) => ({ ...f, ...updates }));
      toast.success("Receipt scanned successfully! Fields auto-filled.");
    } catch (err) {
      console.error("OCR Error:", err);
      toast.error("OCR scanning failed. Please fill in details manually.");
    } finally {
      setIsOCRProcessing(false);
      setOCRProgress(null);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptDataUrl(null);
    setOcrData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.category) e.category = "Please select a category";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      let finalReceiptUrl = receiptDataUrl ?? undefined;
      

      if (receiptFile) {
        try {
          finalReceiptUrl = await apiUploadReceipt(receiptFile);
        } catch (uploadErr) {
          toast.error("Failed to upload receipt. Ensure your file is valid and under 5 MB.");
          setIsSubmitting(false);
          return;
        }
      }

      const expense = await submitExpense({
        title: form.title,
        amount: parseFloat(form.amount),
        currency: form.currency,
        currencySymbol: form.currencySymbol,
        category: form.category,
        description: form.description,
        date: form.date,
        receiptDataUrl: finalReceiptUrl,
        ocrData: ocrData ?? undefined,
      });
      setSubmitted(true);
      toast.success("Expense submitted successfully!");
      setTimeout(() => navigate(`/expenses/${expense.id}`), 1500);
    } catch (err) {
      toast.error("Failed to submit expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCurrencies = ALL_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#d1fae5" }}>
            <CheckCircle size={30} className="text-green-500" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg mb-1">Expense Submitted!</h3>
          <p className="text-gray-500 text-sm">Redirecting to expense details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Submit Expense</h2>
        <p className="text-sm text-gray-500">Fill in expense details or scan a receipt for auto-fill</p>
      </div>

      {/* OCR Section */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "#fce7f3", background: "#fdf2f8" }}>
          <Scan size={16} style={{ color: "#d63384" }} />
          <h3 className="font-semibold text-gray-900 text-sm">Receipt Scanner (OCR)</h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#d63384", color: "white" }}>
            AI Powered
          </span>
        </div>

        <div className="p-5">
          {!receiptPreview ? (
            <label
              className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
              style={{ borderColor: "#f9a8d4" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#fce4ec" }}>
                  <Upload size={18} style={{ color: "#d63384" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Drop receipt file here</p>
                  <p className="text-xs text-gray-400">or click to browse · JPG, PNG, PDF (&lt; 5MB)</p>
                </div>
              </div>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img src={receiptPreview} alt="Receipt" className="max-h-40 rounded-lg border object-contain" style={{ borderColor: "#fce7f3" }} />
                <button onClick={clearReceipt} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 shadow-sm">
                  <X size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {!isOCRProcessing ? (
                  <button
                    type="button"
                    onClick={runOCR}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: "#d63384" }}
                  >
                    <Scan size={14} /> Scan with OCR
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: "#fce4ec", color: "#d63384" }}>
                    <Loader2 size={14} className="animate-spin" />
                    {ocrProgress ? `${ocrProgress.status} (${Math.round(ocrProgress.progress * 100)}%)` : "Processing..."}
                  </div>
                )}
                <button type="button" onClick={clearReceipt} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  <RotateCcw size={12} /> Remove
                </button>
              </div>

              {ocrData && (
                <div className="p-3 rounded-lg text-xs" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="font-semibold text-green-700 mb-1">✓ OCR Extraction Complete</p>
                  {ocrData.merchantName && <p className="text-green-600">Merchant: {ocrData.merchantName}</p>}
                  {ocrData.amount && <p className="text-green-600">Amount: {ocrData.amount}</p>}
                  {ocrData.date && <p className="text-green-600">Date: {ocrData.date}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expense Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#fce7f3" }}>
          <div className="p-4 border-b" style={{ borderColor: "#fce7f3", background: "#fdf2f8" }}>
            <h3 className="font-semibold text-gray-900 text-sm">Expense Details</h3>
          </div>

          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expense Title *</label>
              <input type="text" value={form.title} onChange={set("title")}
                placeholder="e.g., Team Lunch at Bistro, Flight to NYC..."
                className="w-full px-4 py-3 border rounded-lg text-sm outline-none"
                style={{ borderColor: errors.title ? "#dc2626" : "#e5e7eb" }}
                onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                onBlur={(e) => (e.target.style.borderColor = errors.title ? "#dc2626" : "#e5e7eb")} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Amount + Currency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <DollarSign size={13} className="inline mr-1" />
                Amount & Currency *
              </label>
              <div className="flex gap-2">
                {/* Currency selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="flex items-center gap-1.5 px-3 py-3 border rounded-lg text-sm font-semibold whitespace-nowrap"
                    style={{ borderColor: "#e5e7eb", minWidth: "90px", color: "#d63384" }}
                  >
                    {form.currencySymbol} {form.currency}
                    <ChevronDown size={12} />
                  </button>
                  {showCurrencyDropdown && (
                    <div className="absolute z-20 w-56 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-2">
                        <input type="text" value={currencySearch} onChange={(e) => setCurrencySearch(e.target.value)}
                          placeholder="Search currency..." className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none"
                          onFocus={(e) => (e.target.style.borderColor = "#d63384")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} autoFocus />
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {filteredCurrencies.map((c) => (
                          <button key={c.code} type="button" onClick={() => selectCurrency(c)}
                            className="w-full text-left px-4 py-2 hover:bg-pink-50 text-sm flex items-center justify-between">
                            <span className="font-medium">{c.code}</span>
                            <span className="text-xs text-gray-400 truncate ml-2">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{form.currencySymbol}</span>
                  <input type="number" value={form.amount} onChange={set("amount")} step="0.01" min="0"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border rounded-lg text-sm outline-none"
                    style={{ borderColor: errors.amount ? "#dc2626" : "#e5e7eb" }}
                    onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                    onBlur={(e) => (e.target.style.borderColor = errors.amount ? "#dc2626" : "#e5e7eb")} />
                </div>
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              {form.currency !== company?.currency && form.amount && !isNaN(parseFloat(form.amount)) && (
                <p className="text-xs text-gray-400 mt-1">
                  ≈ {company?.currencySymbol}
                  {convertCurrency(parseFloat(form.amount), form.currency, company?.currency ?? "USD").toFixed(2)} {company?.currency}
                </p>
              )}
            </div>

            {/* Category + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Tag size={13} className="inline mr-1" />
                  Category *
                </label>
                <select value={form.category} onChange={set("category")}
                  className="w-full px-4 py-3 border rounded-lg text-sm outline-none"
                  style={{ borderColor: errors.category ? "#dc2626" : "#e5e7eb" }}
                  onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                  onBlur={(e) => (e.target.style.borderColor = errors.category ? "#dc2626" : "#e5e7eb")}>
                  <option value="">Select category...</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  <Calendar size={13} className="inline mr-1" />
                  Date *
                </label>
                <input type="date" value={form.date} onChange={set("date")} max={today}
                  className="w-full px-4 py-3 border rounded-lg text-sm outline-none"
                  style={{ borderColor: errors.date ? "#dc2626" : "#e5e7eb" }}
                  onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                  onBlur={(e) => (e.target.style.borderColor = errors.date ? "#dc2626" : "#e5e7eb")} />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                <FileText size={13} className="inline mr-1" />
                Description
              </label>
              <textarea value={form.description} onChange={set("description")}
                placeholder="Provide context for this expense (meeting purpose, attendees, project, etc.)..."
                rows={3}
                className="w-full px-4 py-3 border rounded-lg text-sm outline-none resize-none"
                style={{ borderColor: "#e5e7eb" }}
                onFocus={(e) => (e.target.style.borderColor = "#d63384")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
            </div>

            {/* Info about approval */}
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#fdf2f8" }}>
              <AlertCircle size={14} style={{ color: "#d63384" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                Your expense will be automatically routed to the appropriate approvers based on configured rules.
                The amount will be shown to approvers in <strong>{company?.currency}</strong> ({company?.currencySymbol}).
              </p>
            </div>
          </div>

          <div className="p-5 border-t flex gap-3" style={{ borderColor: "#fce7f3" }}>
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: isSubmitting ? "#f9a8d4" : "#d63384" }}>
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                : <><CheckCircle size={14} /> Submit Expense</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}