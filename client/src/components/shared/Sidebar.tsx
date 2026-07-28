import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  CalendarClock,
  LayoutGrid,
  MoreHorizontal,
  Receipt,
  Settings,
  Stethoscope,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUi } from "@/contexts/UiContext";
import { PulseLine } from "./PulseLine";

const NAV_ITEMS = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutGrid, roles: ["admin", "doctor", "staff"] },
  { href: "/admin/queue", labelKey: "todayQueue", icon: Activity, roles: ["admin", "doctor", "staff"] },
  { href: "/admin/appointments", labelKey: "appointments", icon: CalendarClock, roles: ["admin", "doctor", "staff"] },
  { href: "/admin/patients", labelKey: "patients", icon: Users, roles: ["admin", "doctor", "staff"] },
  { href: "/admin/users", labelKey: "users", icon: UsersRound, roles: ["admin"] },
  { href: "/admin/doctors", labelKey: "doctors", icon: Stethoscope, roles: ["admin", "doctor", "staff"] },
  { href: "/admin/invoices", labelKey: "invoices", icon: Receipt, roles: ["admin", "staff"] },
  { href: "/admin/settings", labelKey: "settings", icon: Settings, roles: ["admin", "doctor"] },
] as const;

function roleLabel(role: string | undefined, t: ReturnType<typeof useUi>["t"]) {
  if (role === "admin") return t("adminRole");
  if (role === "doctor") return t("doctorRole");
  return t("staffRole");
}

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useUi();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-l border-line bg-paper md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <PulseLine className="h-5 w-11 text-pine" live />
        <div>
          <p className="font-display text-lg font-extrabold leading-tight text-ink">{t("appName")}</p>
          <p className="text-xs text-ink-soft">{t("adminPortal")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = location === item.href;
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-pine-light text-pine-dark" : "text-ink-soft hover:bg-mist hover:text-ink"
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-light font-display text-sm font-bold text-pine-dark">
            {user?.fullName?.charAt(0) ?? "؟"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user?.fullName}</p>
            <p className="truncate text-xs text-ink-soft">{roleLabel(user?.role, t)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AdminMobileTabs() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { user } = useAuth();
  const { t, locale } = useUi();
  const items = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));
  const primaryItems = items.slice(0, 4);
  const overflowItems = items.slice(4);
  const moreActive = overflowItems.some((item) => location === item.href);

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[1px] md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}
      {moreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-40 rounded-card border border-line bg-paper p-2 shadow-card md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {overflowItems.map((item) => {
              const Icon = item.icon;
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium",
                    location === item.href ? "bg-pine-light text-pine-dark" : "text-ink-soft hover:bg-mist hover:text-ink"
                  )}
                >
                  <Icon size={18} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-card backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {primaryItems.map((item) => {
          const active = location === item.href;
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={label}
              className={cn(
                "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors",
                active ? "bg-pine-light text-pine-dark" : "text-ink-soft"
              )}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-label={locale === "ar" ? "المزيد" : "More"}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium",
              moreOpen || moreActive ? "bg-pine-light text-pine-dark" : "text-ink-soft"
            )}
          >
            <MoreHorizontal size={18} />
            <span className="max-w-full truncate">{locale === "ar" ? "المزيد" : "More"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
