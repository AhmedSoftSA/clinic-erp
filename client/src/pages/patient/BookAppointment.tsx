import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Field, Input } from "@/components/shared/Field";
import { formatTime, cn } from "@/lib/utils";

export default function BookAppointment() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const doctorsQuery = trpc.appointments.listDoctorsBySpecialty.useQuery({});
  const specialties = useMemo(
    () => Array.from(new Set((doctorsQuery.data ?? []).map((d) => d.specialty))),
    [doctorsQuery.data]
  );

  const [specialty, setSpecialty] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const doctorsInSpecialty = (doctorsQuery.data ?? []).filter((d) => d.specialty === specialty);

  const slotsQuery = trpc.appointments.getAvailableSlots.useQuery(
    { doctorId: doctorId!, date },
    { enabled: !!doctorId }
  );

  const book = trpc.appointments.book.useMutation({
    onSuccess: () => {
      utils.appointments.listMine.invalidate();
      navigate("/patient/appointments");
    },
  });

  const selectedDoctor = doctorsInSpecialty.find((d) => d.id === doctorId);

  return (
    <>
      <Topbar title="حجز موعد جديد" description="اختر التخصص ثم الطبيب ثم الوقت المناسب" />

      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <Card>
          <h3 className="mb-3 font-display text-sm font-bold text-ink">1. اختر التخصص</h3>
          <div className="flex flex-wrap gap-2">
            {specialties.length === 0 && <p className="text-sm text-ink-soft">لا توجد تخصصات متاحة حاليًا</p>}
            {specialties.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpecialty(s);
                  setDoctorId(null);
                  setSlot(null);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  specialty === s ? "border-pine bg-pine-light text-pine-dark" : "border-line text-ink-soft hover:bg-mist"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        {specialty && (
          <Card>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">2. اختر الطبيب</h3>
            <div className="space-y-2">
              {doctorsInSpecialty.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDoctorId(d.id);
                    setSlot(null);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-right transition-colors",
                    doctorId === d.id ? "border-pine bg-pine-light" : "border-line hover:bg-mist"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{d.user.fullName}</p>
                    <p className="text-xs text-ink-soft">كشفية {d.consultationFee} ر.س</p>
                  </div>
                  {doctorId === d.id && <CheckCircle2 className="text-pine" size={18} />}
                </button>
              ))}
            </div>
          </Card>
        )}

        {doctorId && (
          <Card>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">3. اختر الموعد</h3>
            <Field label="التاريخ" htmlFor="date">
              <Input
                id="date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlot(null);
                }}
              />
            </Field>

            <div className="mt-4">
              {slotsQuery.isLoading ? (
                <p className="text-sm text-ink-soft">جارٍ التحميل...</p>
              ) : (slotsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-ink-soft">لا توجد فترات متاحة بهذا اليوم، جرّب يومًا آخر</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(slotsQuery.data ?? []).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className={cn(
                        "nums rounded-lg border px-2 py-2 text-sm transition-colors",
                        slot === s ? "border-pine bg-pine text-white" : "border-line text-ink-soft hover:bg-mist"
                      )}
                    >
                      {formatTime(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {slot && (
          <Card>
            <h3 className="mb-3 font-display text-sm font-bold text-ink">4. سبب الزيارة (اختياري)</h3>
            <textarea
              className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm focus:border-pine"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: صداع مستمر منذ يومين"
            />

            {book.error && (
              <p className="mt-3 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{book.error.message}</p>
            )}

            <Button
              className="mt-4 w-full"
              disabled={book.isPending}
              onClick={() => doctorId && slot && book.mutate({ doctorId, scheduledAt: slot, reasonForVisit: reason })}
            >
              {book.isPending
                ? "جارٍ التأكيد..."
                : `تأكيد الحجز مع ${selectedDoctor?.user.fullName ?? ""}`}
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}
