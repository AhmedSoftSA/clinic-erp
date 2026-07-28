import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PatientInvoices() {
  const { data, isLoading } = trpc.invoices.listMine.useQuery();

  return (
    <>
      <Topbar title="فواتيري" description="كل فواتيرك ومدفوعاتك" />

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {!isLoading && (data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState title="لا توجد فواتير بعد" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-soft">
                  <th className="px-5 py-3 font-medium">التاريخ</th>
                  <th className="px-5 py-3 font-medium">الإجمالي</th>
                  <th className="px-5 py-3 font-medium">المتبقي</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((inv) => {
                  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                  return (
                    <tr key={inv.id}>
                      <td className="nums px-5 py-3 text-ink-soft">{formatDate(inv.createdAt)}</td>
                      <td className="nums px-5 py-3 text-ink-soft">{formatCurrency(inv.total)}</td>
                      <td className="nums px-5 py-3 text-ink-soft">{formatCurrency(inv.total - paid)}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
