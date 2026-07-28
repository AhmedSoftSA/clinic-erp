import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { Select } from "@/components/shared/Field";
import { formatDateTime } from "@/lib/utils";
import { APPOINTMENT_STATUS } from "@shared/const";

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  checked_in: "بالطابور",
  in_progress: "جاري الفحص",
  completed: "مكتمل",
  cancelled: "ملغي",
  no_show: "لم يحضر",
};

export default function Appointments() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const canManage = user?.role === "staff" || user?.role === "admin";
  const utils = trpc.useUtils();

  const doctorProfile = trpc.admin.getMyDoctorProfile.useQuery(undefined, { enabled: isDoctor });
  const doctorId = isDoctor ? doctorProfile.data?.id : undefined;

  const appointmentsQuery = trpc.appointments.listForDoctor.useQuery(
    { doctorId },
    { enabled: !isDoctor || !!doctorId }
  );
  const updateStatus = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => utils.appointments.listForDoctor.invalidate(),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rows = useMemo(() => {
    const all = appointmentsQuery.data ?? [];
    const filtered = statusFilter === "all" ? all : all.filter((a) => a.status === statusFilter);
    return [...filtered].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [appointmentsQuery.data, statusFilter]);

  return (
    <>
      <Topbar
        title="المواعيد"
        description="كل المواعيد المسجّلة بالنظام"
        action={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
            <option value="all">كل الحالات</option>
            {APPOINTMENT_STATUS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        }
      />

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState title="لا توجد مواعيد مطابقة" description="جرّب تغيير الفلتر أعلاه" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-soft">
                  <th className="px-5 py-3 font-medium">المريض</th>
                  <th className="px-5 py-3 font-medium">الطبيب</th>
                  <th className="px-5 py-3 font-medium">الموعد</th>
                  <th className="px-5 py-3 font-medium">سبب الزيارة</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  {canManage && <th className="px-5 py-3 font-medium">إجراء</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 font-medium text-ink">{a.patient?.user?.fullName}</td>
                    <td className="px-5 py-3 text-ink-soft">{a.doctor?.user?.fullName}</td>
                    <td className="nums px-5 py-3 text-ink-soft">{formatDateTime(a.scheduledAt)}</td>
                    <td className="px-5 py-3 text-ink-soft">{a.reasonForVisit ?? "—"}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={a.status} />
                    </td>
                    {canManage && (
                      <td className="px-5 py-3">
                        {(a.status === "pending" || a.status === "confirmed") && (
                          <button
                            className="text-xs font-medium text-danger hover:underline"
                            onClick={() => updateStatus.mutate({ appointmentId: a.id, status: "cancelled" })}
                          >
                            إلغاء الموعد
                          </button>
                        )}
                      </td>
                    )}
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
