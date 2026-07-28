import { useState } from "react";
import { UserCheck, Stethoscope } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import { formatTime } from "@/lib/utils";
import { ConsultationFlow } from "@/components/admin/ConsultationFlow";

function isToday(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toDateString() === new Date().toDateString();
}

export default function Queue() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const canCheckIn = user?.role === "staff" || user?.role === "admin";
  const utils = trpc.useUtils();

  const doctorProfile = trpc.admin.getMyDoctorProfile.useQuery(undefined, { enabled: isDoctor });
  const doctorId = isDoctor ? doctorProfile.data?.id : undefined;

  const appointmentsQuery = trpc.appointments.listForDoctor.useQuery(
    { doctorId },
    { enabled: !isDoctor || !!doctorId }
  );

  const checkIn = trpc.admin.checkIn.useMutation({
    onSuccess: () => utils.appointments.listForDoctor.invalidate(),
  });

  const [activeAppointment, setActiveAppointment] = useState<{
    id: string;
    patientId: string;
    patientName: string;
    fee: number;
  } | null>(null);

  const todays = (appointmentsQuery.data ?? [])
    .filter((a) => isToday(a.scheduledAt) && a.status !== "cancelled" && a.status !== "completed")
    .sort((a, b) => {
      if (a.status === "checked_in" && b.status !== "checked_in") return -1;
      if (b.status === "checked_in" && a.status !== "checked_in") return 1;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  return (
    <>
      <Topbar title="الطابور اليوم" description="مرضى اليوم مرتبين حسب وقت الوصول" />

      <div className="p-8">
        <Card className="p-0 overflow-hidden">
          {todays.length === 0 ? (
            <div className="p-6">
              <EmptyState title="لا توجد مواعيد اليوم" description="سيظهر مرضى اليوم هنا فور جدولتهم" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-soft">
                  <th className="px-5 py-3 font-medium">الترتيب</th>
                  <th className="px-5 py-3 font-medium">المريض</th>
                  <th className="px-5 py-3 font-medium">الطبيب</th>
                  <th className="px-5 py-3 font-medium">الوقت</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {todays.map((a) => (
                  <tr key={a.id}>
                    <td className="nums px-5 py-3 text-ink-soft">{a.queuePosition ?? "—"}</td>
                    <td className="px-5 py-3 font-medium text-ink">{a.patient?.user?.fullName}</td>
                    <td className="px-5 py-3 text-ink-soft">{a.doctor?.user?.fullName}</td>
                    <td className="nums px-5 py-3 text-ink-soft">{formatTime(a.scheduledAt)}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={a.status} live={a.status === "checked_in"} />
                    </td>
                    <td className="px-5 py-3 text-left">
                      {canCheckIn && (a.status === "pending" || a.status === "confirmed") && (
                        <Button size="sm" variant="secondary" onClick={() => checkIn.mutate({ appointmentId: a.id })}>
                          <UserCheck size={14} /> تسجيل وصول
                        </Button>
                      )}
                      {isDoctor && a.status === "checked_in" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setActiveAppointment({
                              id: a.id,
                              patientId: a.patient!.id,
                              patientName: a.patient!.user!.fullName,
                              fee: a.doctor?.consultationFee ?? 150,
                            })
                          }
                        >
                          <Stethoscope size={14} /> بدء الفحص
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {activeAppointment && (
        <ConsultationFlow
          appointmentId={activeAppointment.id}
          patientId={activeAppointment.patientId}
          patientName={activeAppointment.patientName}
          consultationFee={activeAppointment.fee}
          onClose={() => setActiveAppointment(null)}
          onDone={() => setActiveAppointment(null)}
        />
      )}
    </>
  );
}
