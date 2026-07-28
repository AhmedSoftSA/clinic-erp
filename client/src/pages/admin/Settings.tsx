import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card, CardHeader } from "@/components/shared/Card";
import { Field, Input, Select } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function CreateStaffForm() {
  const utils = trpc.useUtils();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "staff" | "admin">("staff");
  const [specialty, setSpecialty] = useState("");
  const [fee, setFee] = useState(150);

  const create = trpc.admin.createStaffAccount.useMutation({
    onSuccess: () => {
      setFullName("");
      setEmail("");
      setPassword("");
      utils.admin.listDoctors.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader title="إضافة حساب جديد" subtitle="طبيب أو موظف استقبال أو مدير آخر" />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ fullName, email, password, role, specialty: role === "doctor" ? specialty : undefined, consultationFee: fee });
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="الاسم الكامل" htmlFor="fullName">
            <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="الدور" htmlFor="role">
            <Select id="role" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="staff">موظف استقبال</option>
              <option value="doctor">طبيب</option>
              <option value="admin">مدير</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="البريد الإلكتروني" htmlFor="email">
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="كلمة المرور المؤقتة" htmlFor="password">
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
        {role === "doctor" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="التخصص" htmlFor="specialty">
              <Input id="specialty" required value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </Field>
            <Field label="سعر الكشفية (ر.س)" htmlFor="fee">
              <Input id="fee" type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} />
            </Field>
          </div>
        )}
        {create.error && <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{create.error.message}</p>}
        {create.isSuccess && <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success">تم إنشاء الحساب بنجاح</p>}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
        </Button>
      </form>
    </Card>
  );
}

function DoctorScheduleForm() {
  const { user } = useAuth();
  const doctorProfile = trpc.admin.getMyDoctorProfile.useQuery();
  const setSchedule = trpc.admin.setDoctorSchedule.useMutation();

  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slot, setSlot] = useState(20);

  return (
    <Card>
      <CardHeader title="جدول الدوام" subtitle={`إضافة يوم دوام لـ ${user?.fullName}`} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!doctorProfile.data) return;
          setSchedule.mutate({ doctorId: doctorProfile.data.id, dayOfWeek, startTime, endTime, slotDurationMinutes: slot });
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="اليوم" htmlFor="dayOfWeek">
            <Select id="dayOfWeek" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="مدة الفترة (دقيقة)" htmlFor="slot">
            <Input id="slot" type="number" value={slot} onChange={(e) => setSlot(Number(e.target.value))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="من الساعة" htmlFor="start">
            <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="إلى الساعة" htmlFor="end">
            <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
        {setSchedule.isSuccess && <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success">تمت إضافة يوم الدوام</p>}
        <Button type="submit" disabled={setSchedule.isPending || !doctorProfile.data}>
          {setSchedule.isPending ? "جارٍ الحفظ..." : "حفظ يوم الدوام"}
        </Button>
      </form>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <>
      <Topbar title="الإعدادات" />
      <div className="max-w-2xl space-y-6 p-8">
        {user?.role === "admin" && <CreateStaffForm />}
        {user?.role === "doctor" && <DoctorScheduleForm />}
      </div>
    </>
  );
}
