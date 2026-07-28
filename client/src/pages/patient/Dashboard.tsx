import { useMemo } from "react";
import { Link } from "wouter";
import { CalendarPlus, Activity, FileText, Receipt } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card, CardHeader } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/shared/Button";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export default function PatientDashboard() {
  const { user } = useAuth();
  const appointmentsQuery = trpc.appointments.listMine.useQuery();
  const queueQuery = trpc.appointments.getMyQueueStatus.useQuery();
  const invoicesQuery = trpc.invoices.listMine.useQuery();

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (appointmentsQuery.data ?? [])
      .filter((a) => ["pending", "confirmed"].includes(a.status) && new Date(a.scheduledAt).getTime() > now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
  }, [appointmentsQuery.data]);

  const unpaidTotal = (invoicesQuery.data ?? [])
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + (i.total - i.payments.reduce((s, p) => s + p.amount, 0)), 0);

  return (
    <>
      <Topbar
        title={`مرحبًا، ${user?.fullName?.split(" ")[0] ?? ""}`}
        action={
          <Link href="/patient/book">
            <Button>
              <CalendarPlus size={16} /> حجز موعد جديد
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 p-8">
        {queueQuery.data && (
          <Card className="border-pine bg-pine-light/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pine-dark">أنت الآن بطابور د. {queueQuery.data.doctorName}</p>
                <p className="mt-1 text-2xl font-bold text-ink nums">
                  {queueQuery.data.peopleAhead === 0 ? "دورك التالي" : `${queueQuery.data.peopleAhead} أمامك بالدور`}
                </p>
              </div>
              <Activity className="text-pine" size={28} />
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="موعدك القادم" />
            {!upcoming ? (
              <EmptyState title="لا يوجد لديك موعد قادم" description="احجز موعدًا جديدًا في أي وقت" />
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-line p-4">
                <div>
                  <p className="font-medium text-ink">د. {upcoming.doctor?.user?.fullName}</p>
                  <p className="text-sm text-ink-soft">{upcoming.doctor?.specialty}</p>
                  <p className="nums mt-1 text-sm text-ink-soft">{formatDateTime(upcoming.scheduledAt)}</p>
                </div>
                <StatusPill status={upcoming.status} />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="المستحقات المالية" />
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clay-light text-clay">
                <Receipt size={20} />
              </div>
              <div>
                <p className="nums text-2xl font-semibold text-ink">{formatCurrency(unpaidTotal)}</p>
                <p className="text-sm text-ink-soft">مبلغ مستحق</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/patient/medical-file">
            <Card className="flex cursor-pointer items-center gap-3 transition-shadow hover:shadow-lg">
              <FileText className="text-pine" size={20} />
              <span className="text-sm font-medium text-ink">ملفي الطبي والتقارير</span>
            </Card>
          </Link>
          <Link href="/patient/appointments">
            <Card className="flex cursor-pointer items-center gap-3 transition-shadow hover:shadow-lg">
              <Activity className="text-pine" size={20} />
              <span className="text-sm font-medium text-ink">كل مواعيدي</span>
            </Card>
          </Link>
          <Link href="/patient/invoices">
            <Card className="flex cursor-pointer items-center gap-3 transition-shadow hover:shadow-lg">
              <Receipt className="text-pine" size={20} />
              <span className="text-sm font-medium text-ink">فواتيري</span>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}
