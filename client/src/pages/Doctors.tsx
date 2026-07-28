import { Link } from "wouter";
import { CalendarClock, Search, Stethoscope } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useUi } from "@/contexts/UiContext";
import { Topbar } from "@/components/shared/Topbar";
import { Card } from "@/components/shared/Card";
import { Input } from "@/components/shared/Field";
import { EmptyState } from "@/components/shared/EmptyState";

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export default function Doctors() {
  const { user } = useAuth();
  const { t, locale } = useUi();
  const [search, setSearch] = useState("");
  const doctors = trpc.appointments.listDoctorsBySpecialty.useQuery({});
  const days = locale === "ar" ? DAYS_AR : DAYS_EN;

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return doctors.data ?? [];
    return (doctors.data ?? []).filter((doctor) => {
      return (
        doctor.user.fullName.toLowerCase().includes(value) ||
        doctor.specialty.toLowerCase().includes(value)
      );
    });
  }, [doctors.data, search]);

  return (
    <>
      <Topbar title={t("doctorsTitle")} description={t("doctorsDescription")} />

      <div className="space-y-5 p-8">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-soft ltr:left-3 rtl:right-3" size={18} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("doctorSearch")}
            className="ltr:pl-10 rtl:pr-10"
          />
        </div>

        {doctors.isLoading ? (
          <Card>
            <p className="text-sm text-ink-soft">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState title={t("noDoctors")} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((doctor) => (
              <Card key={doctor.id} className="flex min-h-full flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-pine-light font-display text-lg font-bold text-pine-dark">
                    {initials(doctor.user.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-lg font-bold text-ink">{doctor.user.fullName}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                      <Stethoscope size={15} />
                      {doctor.specialty}
                    </p>
                  </div>
                </div>

                {doctor.bio && <p className="text-sm leading-6 text-ink-soft">{doctor.bio}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-line bg-mist p-3">
                    <p className="text-xs text-ink-soft">{t("fee")}</p>
                    <p className="nums mt-1 font-semibold text-ink">
                      {doctor.consultationFee} {t("sar")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-mist p-3">
                    <p className="text-xs text-ink-soft">{t("schedule")}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <CalendarClock size={15} />
                      {doctor.schedules.length}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {doctor.schedules.length === 0 ? (
                    <span className="rounded-full bg-warning-light px-3 py-1 text-xs font-medium text-warning">
                      {t("noSchedule")}
                    </span>
                  ) : (
                    doctor.schedules.slice(0, 5).map((schedule) => (
                      <span
                        key={schedule.id}
                        className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink-soft"
                      >
                        {days[schedule.dayOfWeek]} {schedule.startTime}-{schedule.endTime}
                      </span>
                    ))
                  )}
                </div>

                {user?.role === "patient" && (
                  <Link
                    href="/patient/book"
                    className="mt-auto inline-flex items-center justify-center rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white hover:bg-pine-dark"
                  >
                    {t("bookNow")}
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
