import { useState } from "react";
import { X, FileText, Pill } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

function PatientFileModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const { data, isLoading } = trpc.patients.getFullFile.useQuery({ patientId });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-card bg-paper shadow-card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{data?.patient.user.fullName ?? "الملف الطبي"}</h2>
            <p className="text-sm text-ink-soft">{data?.patient.user.phone ?? data?.patient.user.email}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-mist" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && <p className="text-sm text-ink-soft">جارٍ التحميل...</p>}

          {data && (
            <>
              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink-soft">التاريخ الطبي</h3>
                {data.consultations.length === 0 ? (
                  <p className="text-sm text-ink-soft">لا توجد استشارات سابقة</p>
                ) : (
                  <ul className="space-y-3">
                    {data.consultations.map((c) => (
                      <li key={c.id} className="rounded-lg border border-line p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-ink">{c.diagnosis || "بدون تشخيص مسجّل"}</p>
                          <span className="nums text-xs text-ink-soft">{formatDate(c.createdAt)}</span>
                        </div>
                        {c.symptoms && <p className="mt-1 text-xs text-ink-soft">{c.symptoms}</p>}
                        {c.prescriptions?.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-pine-dark">
                            <Pill size={12} /> يوجد وصفة طبية
                          </div>
                        )}
                        {c.reports?.length > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-info">
                            <FileText size={12} /> {c.reports.length} تقرير موقّع
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink-soft">المواعيد</h3>
                <ul className="divide-y divide-line">
                  {data.appointments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="nums text-ink-soft">{formatDateTime(a.scheduledAt)}</span>
                      <StatusPill status={a.status} />
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink-soft">الفواتير</h3>
                <ul className="divide-y divide-line">
                  {data.invoices.map((i) => (
                    <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="nums text-ink-soft">{formatCurrency(i.total)}</span>
                      <StatusPill status={i.status} />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Patients() {
  const { data, isLoading } = trpc.patients.list.useQuery();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      <Topbar title="المرضى" description="كل المرضى المسجّلين بالنظام" />

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {!isLoading && (data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState title="لا يوجد مرضى مسجّلون بعد" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-soft">
                  <th className="px-5 py-3 font-medium">الاسم</th>
                  <th className="px-5 py-3 font-medium">الهاتف</th>
                  <th className="px-5 py-3 font-medium">البريد الإلكتروني</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((p) => (
                  <tr key={p.id} className="cursor-pointer hover:bg-mist" onClick={() => setSelected(p.id)}>
                    <td className="px-5 py-3 font-medium text-ink">{p.user.fullName}</td>
                    <td className="nums px-5 py-3 text-ink-soft">{p.user.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-ink-soft">{p.user.email}</td>
                    <td className="px-5 py-3 text-left text-xs font-medium text-pine">عرض الملف</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {selected && <PatientFileModal patientId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
