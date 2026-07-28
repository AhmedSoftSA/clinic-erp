import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { FileCheck2 } from "lucide-react";

export default function Reports() {
  const { data, isLoading } = trpc.patients.getMyFullFile.useQuery();

  const reports = (data?.consultations ?? []).flatMap((c) =>
    c.reports.filter((r) => r.isSigned).map((r) => ({ ...r, diagnosis: c.diagnosis }))
  );

  return (
    <>
      <Topbar title="تقاريري الطبية" description="التقارير الموقّعة من الأطباء" />

      <div className="mx-auto max-w-2xl p-8">
        {!isLoading && reports.length === 0 ? (
          <EmptyState title="لا توجد تقارير موقّعة بعد" description="ستظهر تقاريرك هنا بعد توقيعها من الطبيب" />
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <Card key={r.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="text-success" size={18} />
                    <h3 className="font-display text-sm font-bold text-ink">{r.title}</h3>
                  </div>
                  <span className="nums text-xs text-ink-soft">{formatDate(r.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-ink-soft">{r.content}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
