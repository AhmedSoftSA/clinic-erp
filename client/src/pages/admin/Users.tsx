import { useMemo, useState } from "react";
import { CheckCircle2, CircleOff, Search, ShieldCheck, Stethoscope, UserPlus, UsersRound } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useUi } from "@/contexts/UiContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card, CardHeader } from "@/components/shared/Card";
import { Field, Input, Select } from "@/components/shared/Field";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    title: "إدارة المستخدمين",
    description: "حسابات الفريق والمرضى مع حالة التفعيل وبيانات الدخول الأساسية",
    newAccount: "حساب جديد",
    newSubtitle: "أنشئ حساب مدير أو طبيب أو استقبال بدون مغادرة الصفحة",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    password: "كلمة المرور المؤقتة",
    role: "الدور",
    specialty: "التخصص",
    fee: "الكشفية",
    create: "إنشاء الحساب",
    creating: "جارٍ الإنشاء...",
    created: "تم إنشاء الحساب بنجاح",
    directory: "قائمة المستخدمين",
    directorySubtitle: "بحث سريع وفلترة للحسابات النشطة وغير النشطة",
    search: "بحث بالاسم أو البريد أو الجوال",
    allRoles: "كل الأدوار",
    allStatus: "كل الحالات",
    activeOnly: "نشط فقط",
    inactiveOnly: "موقوف فقط",
    active: "نشط",
    inactive: "موقوف",
    deactivate: "إيقاف",
    activate: "تفعيل",
    noUsers: "لا توجد حسابات مطابقة",
    admin: "مدير",
    doctor: "طبيب",
    staff: "استقبال",
    patient: "مريض",
    totalUsers: "إجمالي الحسابات",
    activeUsers: "حسابات نشطة",
    doctors: "أطباء",
    staffCount: "فريق إداري",
  },
  en: {
    title: "User management",
    description: "Team and patient accounts with activation state and core login details",
    newAccount: "New account",
    newSubtitle: "Create an admin, doctor, or reception account without leaving the page",
    fullName: "Full name",
    email: "Email",
    phone: "Mobile number",
    password: "Temporary password",
    role: "Role",
    specialty: "Specialty",
    fee: "Fee",
    create: "Create account",
    creating: "Creating...",
    created: "Account created successfully",
    directory: "User directory",
    directorySubtitle: "Fast search and filtering for active and inactive accounts",
    search: "Search by name, email, or phone",
    allRoles: "All roles",
    allStatus: "All status",
    activeOnly: "Active only",
    inactiveOnly: "Inactive only",
    active: "Active",
    inactive: "Inactive",
    deactivate: "Disable",
    activate: "Enable",
    noUsers: "No matching accounts",
    admin: "Admin",
    doctor: "Doctor",
    staff: "Reception",
    patient: "Patient",
    totalUsers: "Total accounts",
    activeUsers: "Active accounts",
    doctors: "Doctors",
    staffCount: "Admin team",
  },
} as const;

type StaffRole = "admin" | "doctor" | "staff";
type RoleFilter = "all" | "admin" | "doctor" | "staff" | "patient";
type StatusFilter = "all" | "active" | "inactive";

function roleLabel(role: string, labels: (typeof copy)["ar"]) {
  if (role === "admin") return labels.admin;
  if (role === "doctor") return labels.doctor;
  if (role === "staff") return labels.staff;
  return labels.patient;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  tone: "pine" | "info" | "success" | "clay";
}) {
  const tones = {
    pine: "bg-pine-light text-pine-dark",
    info: "bg-info-light text-info",
    success: "bg-success-light text-success",
    clay: "bg-clay-light text-clay",
  };

  return (
    <Card className="flex items-center gap-4">
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tones[tone])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="nums text-2xl font-semibold text-ink">{value}</p>
        <p className="text-sm text-ink-soft">{label}</p>
      </div>
    </Card>
  );
}

function CreateUserCard() {
  const { locale } = useUi();
  const labels = copy[locale];
  const utils = trpc.useUtils();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("admin12345");
  const [role, setRole] = useState<StaffRole>("staff");
  const [specialty, setSpecialty] = useState("");
  const [fee, setFee] = useState(150);

  const create = trpc.admin.createStaffAccount.useMutation({
    onSuccess: () => {
      setFullName("");
      setEmail("");
      setPhone("");
      setSpecialty("");
      utils.admin.listUsers.invalidate();
      utils.admin.listDoctors.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader title={labels.newAccount} subtitle={labels.newSubtitle} action={<UserPlus size={20} className="text-pine" />} />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate({
            fullName,
            email,
            phone: phone || undefined,
            password,
            role,
            specialty: role === "doctor" ? specialty : undefined,
            consultationFee: role === "doctor" ? fee : undefined,
          });
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={labels.fullName} htmlFor="userFullName">
            <Input id="userFullName" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </Field>
          <Field label={labels.role} htmlFor="userRole">
            <Select id="userRole" value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
              <option value="staff">{labels.staff}</option>
              <option value="doctor">{labels.doctor}</option>
              <option value="admin">{labels.admin}</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={labels.email} htmlFor="userEmail">
            <Input id="userEmail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label={labels.phone} htmlFor="userPhone">
            <Input id="userPhone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={labels.password} htmlFor="userPassword">
            <Input id="userPassword" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          {role === "doctor" && (
            <Field label={labels.fee} htmlFor="userFee">
              <Input id="userFee" type="number" min={0} value={fee} onChange={(event) => setFee(Number(event.target.value))} />
            </Field>
          )}
        </div>

        {role === "doctor" && (
          <Field label={labels.specialty} htmlFor="userSpecialty">
            <Input id="userSpecialty" required value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
          </Field>
        )}

        {create.error && <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{create.error.message}</p>}
        {create.isSuccess && <p className="rounded-lg bg-success-light px-3 py-2 text-sm text-success">{labels.created}</p>}
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? labels.creating : labels.create}
        </Button>
      </form>
    </Card>
  );
}

export default function Users() {
  const { user } = useAuth();
  const { locale } = useUi();
  const labels = copy[locale];
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.listUsers.useQuery();
  const updateStatus = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const users = usersQuery.data ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((account) => {
      const matchesRole = role === "all" || account.role === role;
      const matchesStatus = status === "all" || (status === "active" ? account.isActive : !account.isActive);
      const searchable = `${account.fullName} ${account.email} ${account.phone ?? ""}`.toLowerCase();
      return matchesRole && matchesStatus && (!needle || searchable.includes(needle));
    });
  }, [query, role, status, users]);

  const activeUsers = users.filter((account) => account.isActive).length;
  const doctors = users.filter((account) => account.role === "doctor").length;
  const adminTeam = users.filter((account) => account.role === "admin" || account.role === "staff").length;

  return (
    <>
      <Topbar title={labels.title} description={labels.description} />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={UsersRound} label={labels.totalUsers} value={users.length} tone="pine" />
          <SummaryCard icon={CheckCircle2} label={labels.activeUsers} value={activeUsers} tone="success" />
          <SummaryCard icon={Stethoscope} label={labels.doctors} value={doctors} tone="info" />
          <SummaryCard icon={ShieldCheck} label={labels.staffCount} value={adminTeam} tone="clay" />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Card className="min-w-0">
            <CardHeader title={labels.directory} subtitle={labels.directorySubtitle} />
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
              <label className="relative block">
                <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft ltr:left-3 rtl:right-3" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={labels.search}
                  className="ltr:pl-9 rtl:pr-9"
                />
              </label>
              <Select value={role} onChange={(event) => setRole(event.target.value as RoleFilter)}>
                <option value="all">{labels.allRoles}</option>
                <option value="admin">{labels.admin}</option>
                <option value="doctor">{labels.doctor}</option>
                <option value="staff">{labels.staff}</option>
                <option value="patient">{labels.patient}</option>
              </Select>
              <Select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
                <option value="all">{labels.allStatus}</option>
                <option value="active">{labels.activeOnly}</option>
                <option value="inactive">{labels.inactiveOnly}</option>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-mist px-4 text-center">
                <CircleOff className="mb-2 text-ink-soft" size={22} />
                <p className="text-sm font-medium text-ink">{labels.noUsers}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-mist text-ink-soft">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{labels.fullName}</th>
                      <th className="px-4 py-3 text-start font-medium">{labels.role}</th>
                      <th className="px-4 py-3 text-start font-medium">{labels.phone}</th>
                      <th className="px-4 py-3 text-start font-medium">{labels.active}</th>
                      <th className="px-4 py-3 text-end font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-paper">
                    {filtered.map((account) => (
                      <tr key={account.id} className="align-middle">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{account.fullName}</p>
                          <p className="text-xs text-ink-soft">{account.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-pine-light px-2.5 py-1 text-xs font-medium text-pine-dark">
                            {roleLabel(account.role, labels)}
                          </span>
                        </td>
                        <td className="nums px-4 py-3 text-ink-soft">{account.phone ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium",
                              account.isActive ? "bg-success-light text-success" : "bg-danger-light text-danger"
                            )}
                          >
                            {account.isActive ? labels.active : labels.inactive}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <Button
                            type="button"
                            size="sm"
                            variant={account.isActive ? "secondary" : "primary"}
                            disabled={updateStatus.isPending || account.id === user?.id}
                            onClick={() => updateStatus.mutate({ userId: account.id, isActive: !account.isActive })}
                          >
                            {account.isActive ? labels.deactivate : labels.activate}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <CreateUserCard />
        </div>
      </div>
    </>
  );
}
