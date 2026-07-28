import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "bg-warning-light", text: "text-warning", dot: "bg-warning", label: "بانتظار التأكيد" },
  confirmed: { bg: "bg-info-light", text: "text-info", dot: "bg-info", label: "مؤكد" },
  checked_in: { bg: "bg-pine-light", text: "text-pine-dark", dot: "bg-pine", label: "بالطابور" },
  in_progress: { bg: "bg-clay-light", text: "text-clay", dot: "bg-clay", label: "جاري الفحص" },
  completed: { bg: "bg-success-light", text: "text-success", dot: "bg-success", label: "مكتمل" },
  cancelled: { bg: "bg-danger-light", text: "text-danger", dot: "bg-danger", label: "ملغي" },
  no_show: { bg: "bg-danger-light", text: "text-danger", dot: "bg-danger", label: "لم يحضر" },
  unpaid: { bg: "bg-danger-light", text: "text-danger", dot: "bg-danger", label: "غير مدفوعة" },
  paid: { bg: "bg-success-light", text: "text-success", dot: "bg-success", label: "مدفوعة" },
  partially_paid: { bg: "bg-warning-light", text: "text-warning", dot: "bg-warning", label: "مدفوعة جزئيًا" },
  refunded: { bg: "bg-info-light", text: "text-info", dot: "bg-info", label: "مستردة" },
};

export function StatusPill({ status, live = false }: { status: string; live?: boolean }) {
  const style = STATUS_STYLES[status] ?? {
    bg: "bg-line",
    text: "text-ink-soft",
    dot: "bg-ink-soft",
    label: status,
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        style.bg,
        style.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot, live && "animate-pulse-line")} />
      {style.label}
    </span>
  );
}
