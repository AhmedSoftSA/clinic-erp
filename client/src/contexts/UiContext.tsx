import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
type Locale = "ar" | "en";

const translations = {
  ar: {
    appName: "عيادتي",
    adminPortal: "نظام إدارة العيادة",
    patientPortal: "بوابة المريض",
    dashboard: "لوحة الرئيسية",
    todayQueue: "الطابور اليوم",
    appointments: "المواعيد",
    patients: "المرضى",
    users: "المستخدمين",
    doctors: "الأطباء",
    invoices: "الفواتير",
    settings: "الإعدادات",
    bookAppointment: "حجز موعد",
    myAppointments: "مواعيدي",
    queueStatus: "حالة الطابور",
    medicalFile: "ملفي الطبي",
    reports: "تقاريري",
    logout: "خروج",
    signOut: "تسجيل الخروج",
    adminRole: "مدير النظام",
    doctorRole: "طبيب",
    staffRole: "موظف استقبال",
    patientRole: "مريض",
    light: "فاتح",
    dark: "داكن",
    english: "EN",
    arabic: "AR",
    doctorsTitle: "قائمة الأطباء",
    doctorsDescription: "كل الأطباء المتاحين في العيادة وتخصصاتهم وجداولهم",
    doctorSearch: "ابحث باسم الطبيب أو التخصص",
    noDoctors: "لا توجد بيانات أطباء متاحة",
    fee: "الكشفية",
    schedule: "الدوام",
    noSchedule: "لا يوجد جدول دوام",
    bookNow: "حجز موعد",
    sar: "ر.س",
    loginTitle: "تسجيل الدخول إلى نظام إدارة العيادة",
    registerTitle: "إنشاء حساب مريض جديد",
    fullName: "الاسم الكامل",
    phone: "رقم الجوال",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loginButton: "تسجيل الدخول",
    registerButton: "إنشاء الحساب",
    processing: "جارٍ التنفيذ...",
    newPatient: "مريض جديد؟ أنشئ حسابًا",
    hasAccount: "لديك حساب بالفعل؟ سجّل الدخول",
  },
  en: {
    appName: "Clinic ERP",
    adminPortal: "Clinic management system",
    patientPortal: "Patient portal",
    dashboard: "Dashboard",
    todayQueue: "Today queue",
    appointments: "Appointments",
    patients: "Patients",
    users: "Users",
    doctors: "Doctors",
    invoices: "Invoices",
    settings: "Settings",
    bookAppointment: "Book",
    myAppointments: "My visits",
    queueStatus: "Queue",
    medicalFile: "Medical file",
    reports: "Reports",
    logout: "Logout",
    signOut: "Sign out",
    adminRole: "System admin",
    doctorRole: "Doctor",
    staffRole: "Reception staff",
    patientRole: "Patient",
    light: "Light",
    dark: "Dark",
    english: "EN",
    arabic: "AR",
    doctorsTitle: "Doctors",
    doctorsDescription: "Available clinic doctors, specialties, fees, and working hours",
    doctorSearch: "Search by doctor name or specialty",
    noDoctors: "No doctors are available",
    fee: "Fee",
    schedule: "Schedule",
    noSchedule: "No schedule set",
    bookNow: "Book appointment",
    sar: "SAR",
    loginTitle: "Sign in to the clinic management system",
    registerTitle: "Create a new patient account",
    fullName: "Full name",
    phone: "Mobile number",
    email: "Email",
    password: "Password",
    loginButton: "Sign in",
    registerButton: "Create account",
    processing: "Processing...",
    newPatient: "New patient? Create an account",
    hasAccount: "Already have an account? Sign in",
  },
} as const;

type TranslationKey = keyof typeof translations.ar;

interface UiContextValue {
  theme: Theme;
  locale: Locale;
  dir: "rtl" | "ltr";
  setTheme: (theme: Theme) => void;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
}

const UiContext = createContext<UiContextValue | null>(null);

function readStorage<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStorage("clinic-theme", "light", ["light", "dark"]));
  const [locale, setLocale] = useState<Locale>(() => readStorage("clinic-locale", "ar", ["ar", "en"]));
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    window.localStorage.setItem("clinic-theme", theme);
    window.localStorage.setItem("clinic-locale", locale);
  }, [theme, locale, dir]);

  const value = useMemo<UiContextValue>(
    () => ({
      theme,
      locale,
      dir,
      setTheme,
      setLocale,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      toggleLocale: () => setLocale((current) => (current === "ar" ? "en" : "ar")),
      t: (key) => translations[locale][key],
    }),
    [theme, locale, dir]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}
