import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/utils";

export default function MyAppointments() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.appointments.listMine.useQuery();
  const cancel = trpc.appointments.cancelMine.useMutation({
    onSuccess: () => utils.appointments.listMine.invalidate(),
  });

  return (
    <>
      <Topbar title="مواعيدي" description="كل مواعيدك السابقة والقادمة" />

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {!isLoading && (data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState title="لا توجد لديك مواعيد بعد" description="احجز موعدك الأول من صفحة حجز موعد" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-soft">
                  <th className="px-5 py-3 font-medium">الطبيب</th>
                  <th className="px-5 py-3 font-medium">الموعد</th>
                  <th className="px-5 py-3 font-medium">سبب الزيارة</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium text-ink">
                      د. {a.doctor?.user?.fullName}
                      <p className="text-xs font-normal text-ink-soft">{a.doctor?.specialty}</p>
                    </td>
                    <td className="nums px-5 py-3 text-ink-soft">{formatDateTime(a.scheduledAt)}</td>
                    <td className="px-5 py-3 text-ink-soft">{a.reasonForVisit ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-left">
                      {(a.status === "pending" || a.status === "confirmed") && (
                        <button
                          className="text-xs font-medium text-danger hover:underline"
                          onClick={() => cancel.mutate({ appointmentId: a.id })}
                        >
                          إلغاء
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
