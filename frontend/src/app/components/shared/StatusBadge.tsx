type Status = "pending" | "approved" | "rejected" | "draft" | "skipped";

const config: Record<Status, { label: string; bg: string; color: string }> = {
  pending:  { label: "Pending",  bg: "#fef3c7", color: "#d97706" },
  approved: { label: "Approved", bg: "#d1fae5", color: "#059669" },
  rejected: { label: "Rejected", bg: "#fee2e2", color: "#dc2626" },
  draft:    { label: "Draft",    bg: "#f3f4f6", color: "#6b7280" },
  skipped:  { label: "Skipped",  bg: "#e0e7ff", color: "#6366f1" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, bg, color } = config[status] ?? config.draft;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}
