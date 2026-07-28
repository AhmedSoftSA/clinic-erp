import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Topbar } from "@/components/shared/Topbar";
import { Card, CardHeader } from "@/components/shared/Card";
import { Field, Input, Select } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";

export default function MedicalFile() {
  const { data, isLoading } = trpc.patients.getMyFullFile.useQuery();
  const utils = trpc.useUtils();
  const updateInfo = trpc.patients.updateMedicalInfo.useMutation({
    onSuccess: () => utils.patients.getMyFullFile.invalidate(),
  });

  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  useEffect(() => {
    if (data?.patient) {
      setBloodType(data.patient.bloodType ?? "");
      setAllergies(data.patient.allergies ? JSON.parse(data.patient.allergies).join("، ") : "");
      setEmergencyName(data.patient.emergencyContactName ?? "");
      setEmergencyPhone(data.patient.emergencyContactPhone ?? "");
    }
  }, [data?.patient]);

  return (
    <>
      <Topbar title="ملفي الطبي" description="بياناتك الأساسية وتاريخك المرضي" />

      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <Card>
          <CardHeader title="البيانات الأساسية" />
          {isLoading ? (
            <p className="text-sm text-ink-soft">جارٍ التحميل...</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!data) return;
                updateInfo.mutate({
                  patientId: data.patient.id,
                  bloodType: bloodType || undefined,
                  allergies: allergies ? allergies.split("،").map((a) => a.trim()).filter(Boolean) : [],
                  emergencyContactName: emergencyName || undefined,
                  emergencyContactPhone: emergencyPhone || undefined,
                });
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="فصيلة الدم" htmlFor="bloodType">
                  <Select id="bloodType" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                    <option value="">غير محددة</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="الحساسية (افصل بفاصلة ،)" htmlFor="allergies">
                  <Input id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="بنسلين، مكسرات" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="جهة اتصال للطوارئ" htmlFor="emName">
                  <Input id="emName" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                </Field>
                <Field label="هاتف الطوارئ" htmlFor="emPhone">
                  <Input id="emPhone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </Field>
              </div>
              {updateInfo.isSuccess && (
                <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success">تم حفظ التحديثات</p>
              )}
              <Button type="submit" disabled={updateInfo.isPending}>
                {updateInfo.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
              </Button>
            </form>
          )}
        </Card>

        <Card>
          <CardHeader title="التاريخ المرضي" subtitle="الاستشارات والوصفات السابقة" />
          {(data?.consultations ?? []).length === 0 ? (
            <EmptyState title="لا يوجد تاريخ مرضي بعد" />
          ) : (
            <ul className="space-y-3">
              {data!.consultations.map((c) => (
                <li key={c.id} className="rounded-lg border border-line p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{c.diagnosis || "بدون تشخيص مسجّل"}</p>
                    <span className="nums text-xs text-ink-soft">{formatDate(c.createdAt)}</span>
                  </div>
                  {c.symptoms && <p className="mt-1 text-xs text-ink-soft">{c.symptoms}</p>}
                  {c.prescriptions.map((p) => {
                    const meds = JSON.parse(p.medications) as { name: string; dosage: string }[];
                    return (
                      <p key={p.id} className="mt-2 text-xs text-pine-dark">
                        الوصفة: {meds.map((m) => `${m.name} (${m.dosage})`).join("، ")}
                      </p>
                    );
                  })}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
