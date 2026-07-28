import { useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/shared/Button";
import { Field, Input, Select } from "@/components/shared/Field";
import { formatCurrency, formatDate } from "@/lib/utils";

function PaymentModal({
  invoiceId,
  remaining,
  onClose,
}: {
  invoiceId: string;
  remaining: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState<"cash" | "card" | "bank_transfer" | "insurance">("cash");

  const recordPayment = trpc.invoices.recordPayment.useMutation({
    onSuccess: () => {
      utils.invoices.listAll.invalidate();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded-card bg-paper shadow-card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">تسجيل دفعة</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-mist" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <Field label="المبلغ (ر.س)" htmlFor="amount">
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </Field>
          <Field label="طريقة الدفع" htmlFor="method">
            <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="cash">نقدًا</option>
              <option value="card">بطاقة</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="insurance">تأمين</option>
            </Select>
          </Field>
        </div>
        <div className="border-t border-line px-6 py-4">
          <Button
            className="w-full"
            disabled={recordPayment.isPending || amount <= 0}
            onClick={() => recordPayment.mutate({ invoiceId, amount, method })}
          >
            {recordPayment.isPending ? "جارٍ التسجيل..." : "تأكيد الدفع"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const { data, isLoading } = trpc.invoices.listAll.useQuery();
  const [payingInvoice, setPayingInvoice] = useState<{ id: string; remaining: number } | null>(null);

  return (
    <>
      <Topbar title="الفواتير" description="متابعة الفواتير والمدفوعات" />

      <div className="p-8">
        <Card className="overflow-hidden p-0">
          {!isLoading && (data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState title="لا توجد فواتير بعد" description="ستظهر الفواتير هنا فور إصدارها بعد الفحوصات" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-soft">
                  <th className="px-5 py-3 font-medium">المريض</th>
                  <th className="px-5 py-3 font-medium">التاريخ</th>
                  <th className="px-5 py-3 font-medium">الإجمالي</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((inv) => {
                  const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
                  const remaining = inv.total - paid;
                  return (
                    <tr key={inv.id}>
                      <td className="px-5 py-3 font-medium text-ink">{inv.patient?.user?.fullName}</td>
                      <td className="nums px-5 py-3 text-ink-soft">{formatDate(inv.createdAt)}</td>
                      <td className="nums px-5 py-3 text-ink-soft">{formatCurrency(inv.total)}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={inv.status} />
                      </td>
                      <td className="px-5 py-3 text-left">
                        {inv.status !== "paid" && inv.status !== "cancelled" && (
                          <Button size="sm" variant="secondary" onClick={() => setPayingInvoice({ id: inv.id, remaining })}>
                            تسجيل دفعة
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {payingInvoice && (
        <PaymentModal
          invoiceId={payingInvoice.id}
          remaining={payingInvoice.remaining}
          onClose={() => setPayingInvoice(null)}
        />
      )}
    </>
  );
}
