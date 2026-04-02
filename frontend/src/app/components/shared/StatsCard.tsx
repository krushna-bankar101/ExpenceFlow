import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
}

export function StatsCard({ title, value, subtitle, icon: Icon, iconBg = "#fce4ec", iconColor = "#d63384", trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-start gap-4" style={{ borderColor: "#fce7f3" }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.positive ? "text-green-600" : "text-red-500"}`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
