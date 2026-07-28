import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { Bell, Languages, LogOut, Moon, Sun } from "lucide-react";
import { useUi } from "@/contexts/UiContext";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

export function Topbar({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  const [, navigate] = useLocation();
  const { user, refetch } = useAuth();
  const { locale, theme, toggleTheme, toggleLocale, t } = useUi();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/");
    },
  });
  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="border-b border-line bg-paper/80 px-4 py-4 backdrop-blur md:px-8 md:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-bold text-ink md:text-xl">{title}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{description ?? today}</p>
        </div>
        {user && (
          <div className="flex flex-shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-mist hover:text-ink"
            >
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-paper rtl:left-1.5 rtl:right-auto" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("light") : t("dark")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-mist hover:text-ink"
            >
              <ThemeIcon size={16} />
            </button>
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={locale === "ar" ? t("english") : t("arabic")}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-ink-soft hover:bg-mist hover:text-ink"
            >
              <Languages size={15} />
              {locale === "ar" ? t("english") : t("arabic")}
            </button>
            <button
              type="button"
              onClick={() => logout.mutate()}
              aria-label={t("signOut")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-danger-light hover:text-danger"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </header>
  );
}
