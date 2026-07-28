import { useState } from "react";
import { X, Stethoscope, Pill, FileText, Receipt, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/shared/Button";
import { Field, Input } from "@/components/shared/Field";

type Step = "vitals" | "prescription" | "report" | "invoice" | "done";

const STEPS: { key: Step; label: string; icon: typeof Stethoscope }[] = [
  { key: "vitals", label: "الفحص والتشخيص", icon: Stethoscope },
  { key: "prescription", label: "الوصفة الطبية", icon: Pill },
  { key: "report", label: "التقرير والتوقيع", icon: FileText },
  { key: "invoice", label: "الفاتورة", icon: Receipt },
];

export function ConsultationFlow({
  appointmentId,
  patientId,
  patientName,
  consultationFee,
  onClose,
  onDone,
}: {
  appointmentId: string;
  patientId: string;
  patientName: string;
  consultationFee: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const utils = trpc.useUtils();
  const [step, setStep] = useState<Step>("vitals");
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [bp, setBp] = useState("");
  const [temp, setTemp] = useState("");

  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [skipPrescription, setSkipPrescription] = useState(false);

  const [reportTitle, setReportTitle] = useState("");
  const [reportContent, setReportContent] = useState("");

  const [invoiceDesc, setInvoiceDesc] = useState("كشفية طبيب");
  const [invoicePrice, setInvoicePrice] = useState(consultationFee || 150);

  const startConsultation = trpc.consultations.start.useMutation({
    onSuccess: (c) => {
      setConsultationId(c.id);
      setStep("prescription");
    },
  });
  const addPrescription = trpc.consultations.addPrescription.useMutation({
    onSuccess: () => setStep("report"),
  });
  const createReport = trpc.consultations.createReport.useMutation({
    onSuccess: (r) => setReportId(r.id),
  });
  const signReport = trpc.consultations.signReport.useMutation({
    onSuccess: () => setStep("invoice"),
  });
  const createInvoice = trpc.invoices.createFromConsultation.useMutation({
    onSuccess: () => {
      setStep("done");
      utils.appointments.listForDoctor.invalidate();
      utils.admin.getTodayQueue.invalidate();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-card bg-paper shadow-card">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">فحص المريض</h2>
            <p className="text-sm text-ink-soft">{patientName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-mist" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        {/* شريط الخطوات */}
        <div className="flex items-center gap-2 border-b border-line px-6 py-3">
          {STEPS.map((s, i) => {
            const currentIndex = STEPS.findIndex((x) => x.key === step);
            const done = step === "done" || i < currentIndex;
            const active = s.key === step;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                    done ? "bg-success text-white" : active ? "bg-pine text-white" : "bg-mist text-ink-soft"
                  }`}
                >
                  {done ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                </div>
                {i < STEPS.length - 1 && <div className="h-px w-4 bg-line" />}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "vitals" && (
            <div className="space-y-4">
              <Field label="الأعراض" htmlFor="symptoms">
                <textarea
                  id="symptoms"
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm focus:border-pine"
                  rows={2}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </Field>
              <Field label="التشخيص" htmlFor="diagnosis">
                <Input id="diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ضغط الدم" htmlFor="bp">
                  <Input id="bp" placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} />
                </Field>
                <Field label="الحرارة (°C)" htmlFor="temp">
                  <Input id="temp" type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {step === "prescription" && !skipPrescription && (
            <div className="space-y-4">
              <Field label="اسم الدواء" htmlFor="medName">
                <Input id="medName" value={medName} onChange={(e) => setMedName(e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="الجرعة" htmlFor="dosage">
                  <Input id="dosage" placeholder="500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                </Field>
                <Field label="التكرار" htmlFor="frequency">
                  <Input id="frequency" placeholder="كل 8 ساعات" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                </Field>
                <Field label="المدة" htmlFor="duration">
                  <Input id="duration" placeholder="5 أيام" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {step === "report" && (
            <div className="space-y-4">
              <Field label="عنوان التقرير" htmlFor="reportTitle">
                <Input id="reportTitle" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
              </Field>
              <Field label="محتوى التقرير" htmlFor="reportContent">
                <textarea
                  id="reportContent"
                  className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm focus:border-pine"
                  rows={4}
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                />
              </Field>
            </div>
          )}

          {step === "invoice" && (
            <div className="space-y-4">
              <Field label="بند الفاتورة" htmlFor="invoiceDesc">
                <Input id="invoiceDesc" value={invoiceDesc} onChange={(e) => setInvoiceDesc(e.target.value)} />
              </Field>
              <Field label="المبلغ (ر.س)" htmlFor="invoicePrice">
                <Input
                  id="invoicePrice"
                  type="number"
                  value={invoicePrice}
                  onChange={(e) => setInvoicePrice(Number(e.target.value))}
                />
              </Field>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success">
                <CheckCircle2 size={24} />
              </div>
              <p className="font-display font-bold text-ink">اكتمل الفحص بنجاح</p>
              <p className="text-sm text-ink-soft">تم توقيع التقرير وإصدار الفاتورة وإشعار المريض</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          {step === "prescription" ? (
            <button
              className="text-sm text-ink-soft hover:text-ink"
              onClick={() => setStep("report")}
            >
              تخطي الوصفة
            </button>
          ) : (
            <span />
          )}

          {step === "vitals" && (
            <Button
              disabled={startConsultation.isPending}
              onClick={() =>
                startConsultation.mutate({
                  appointmentId,
                  symptoms,
                  diagnosis,
                  vitals: { bloodPressure: bp || undefined, temperature: temp ? Number(temp) : undefined },
                })
              }
            >
              {startConsultation.isPending ? "جارٍ الحفظ..." : "التالي: الوصفة"}
            </Button>
          )}

          {step === "prescription" && (
            <Button
              disabled={addPrescription.isPending || !medName}
              onClick={() =>
                consultationId &&
                addPrescription.mutate({
                  consultationId,
                  medications: [{ name: medName, dosage, frequency, duration }],
                })
              }
            >
              {addPrescription.isPending ? "جارٍ الحفظ..." : "التالي: التقرير"}
            </Button>
          )}

          {step === "report" && (
            <Button
              disabled={createReport.isPending || signReport.isPending || !reportTitle || !reportContent}
              onClick={async () => {
                if (!consultationId) return;
                const report = await createReport.mutateAsync({
                  consultationId,
                  title: reportTitle,
                  content: reportContent,
                });
                await signReport.mutateAsync({ reportId: report.id });
              }}
            >
              {createReport.isPending || signReport.isPending ? "جارٍ التوقيع..." : "توقيع التقرير"}
            </Button>
          )}

          {step === "invoice" && (
            <Button
              disabled={createInvoice.isPending}
              onClick={() =>
                createInvoice.mutate({
                  appointmentId,
                  patientId,
                  items: [{ description: invoiceDesc, quantity: 1, unitPrice: invoicePrice }],
                  taxRate: 0.15,
                })
              }
            >
              {createInvoice.isPending ? "جارٍ الإصدار..." : "إصدار الفاتورة"}
            </Button>
          )}

          {step === "done" && <Button onClick={onDone}>تم</Button>}
        </div>
      </div>
    </div>
  );
}
