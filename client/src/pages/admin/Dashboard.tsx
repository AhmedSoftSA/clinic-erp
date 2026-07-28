import { useMemo } from "react";
import { Link } from "wouter";
import { CalendarClock, Activity, Receipt, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card, CardHeader } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatTime } from "@/lib/utils";

function isToday(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: number | string;
  tone: "pine" | "clay" | "success" | "info";
}) {
  const toneClasses: Record<string, string> = {
    pine: "bg-pine-light text-pine-dark",
    clay: "bg-clay-light text-clay",
    success: "bg-success-light text-success",
    info: "bg-info-light text-info",
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="nums text-2xl font-semibold text-ink">{value}</p>
        <p className="text-sm text-ink-soft">{label}</p>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const doctorProfile = trpc.admin.getMyDoctorProfile.useQuery(undefined, { enabled: isDoctor });
  const doctorId = isDoctor ? doctorProfile.data?.id : undefined;

  const appointmentsQuery = trpc.appointments.listForDoctor.useQuery(
    { doctorId },
    { enabled: !isDoctor || !!doctorId }
  );
  const invoicesQuery = trpc.invoices.listAll.useQuery(undefined, { enabled: !isDoctor });

  const todayAppointments = useMemo(
    () => (appointmentsQuery.data ?? []).filter((a) => isToday(a.scheduledAt)),
    [appointmentsQuery.data]
  );
  const queue = todayAppointments
    .filter((a) => a.status === "checked_in")
    .sort((a, b) => (a.queuePosition ?? 0) - (b.queuePosition ?? 0));
  const completedToday = todayAppointments.filter((a) => a.status === "completed").length;
  const unpaidInvoices = (invoicesQuery.data ?? []).filter((i) => i.status !== "paid").length;

  return (
    <>
      <Topbar title={`مرحبًا، ${user?.fullName?.split(" ")[0] ?? ""}`} />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarClock} label="مواعيد اليوم" value={todayAppointments.length} tone="pine" />
          <StatCard icon={Activity} label="بالطابور الآن" value={queue.length} tone="clay" />
          <StatCard icon={CheckCircle2} label="اكتملت اليوم" value={completedToday} tone="success" />
          {!isDoctor && (
            <StatCard icon={Receipt} label="فواتير غير مسددة" value={unpaidInvoices} tone="info" />
          )}
        </div>

        <Card>
          <CardHeader
            title="الطابور الحالي"
            subtitle="المرضى الذين وصلوا العيادة بانتظار دورهم"
            action={
              <Link href="/admin/queue" className="text-sm font-medium text-pine hover:underline">
                عرض الكل
              </Link>
            }
          />
          {queue.length === 0 ? (
            <EmptyState title="لا يوجد أحد بالطابور حاليًا" description="سيظهر المرضى هنا فور تسجيل وصولهم" />
          ) : (
            <ul className="divide-y divide-line">
              {queue.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="nums flex h-8 w-8 items-center justify-center rounded-full bg-mist text-sm font-semibold text-ink">
                      {a.queuePosition}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{a.patient?.user?.fullName}</p>
                      <p className="text-xs text-ink-soft">
                        موعد {formatTime(a.scheduledAt)} · د. {a.doctor?.user?.fullName}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={a.status} live />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
