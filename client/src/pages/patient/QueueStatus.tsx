import { Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { PulseLine } from "@/components/shared/PulseLine";

export default function QueueStatus() {
  const { data, isLoading } = trpc.appointments.getMyQueueStatus.useQuery(undefined, {
    refetchInterval: 15000,
  });

  return (
    <>
      <Topbar title="حالة الطابور" description="يتحدّث تلقائيًا كل 15 ثانية" />

      <div className="mx-auto max-w-md p-8">
        <Card>
          {isLoading ? (
            <p className="text-center text-sm text-ink-soft">جارٍ التحميل...</p>
          ) : !data ? (
            <EmptyState
              title="لست بالطابور حاليًا"
              description="سجّل وصولك عند وصولك للعيادة ليظهر ترتيبك هنا"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <PulseLine className="h-6 w-16 text-pine" live />
              <div>
                <p className="text-sm text-ink-soft">أنت بطابور د. {data.doctorName}</p>
                <p className="nums mt-2 text-4xl font-bold text-ink">
                  {data.peopleAhead === 0 ? "دورك التالي" : data.peopleAhead}
                </p>
                {data.peopleAhead > 0 && <p className="mt-1 text-sm text-ink-soft">مريض أمامك بالدور</p>}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-pine-light px-4 py-1.5 text-xs font-medium text-pine-dark">
                <Activity size={13} />
                رقمك بالطابور: {data.queuePosition}
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
