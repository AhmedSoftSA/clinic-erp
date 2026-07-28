import { useState } from "react";
import { useLocation } from "wouter";
import {
  BriefcaseMedical,
  Check,
  CircleUserRound,
  Eye,
  Globe2,
  Headset,
  LockKeyhole,
  LogIn,
  Mail,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useUi } from "@/contexts/UiContext";
import { cn } from "@/lib/utils";

const CLINIC_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBrKi3MOGZEOeCMED0k1jDx6WLxU5Vh-C71pa6KxceAqGqCXeGApdVBTifeEMNOOifGUP1-vuU0tqcQwffVVO-_h5dYKMVuWyd1oPPSCZzlsT-UnRVXAjUeowR32dvtXSBsdK_SQJWz0t6B9cYUyfFCY9cZc2Lu9u7RVJFLs6YovEz26oLNBrIc8W_opDooHK4W2XBt94Q8sbH5R0w6-7NYAF9XH53fotOzld_TJgy_M0QWmoOLvC1p8Akq2v_n7bXxcCW9xReydXg";

const text = {
  ar: {
    app: "عيادتي",
    portal: "نظام إدارة العيادة",
    welcome: "أهلًا بك مرة أخرى",
    intro: "سجل الدخول لإدارة عيادتك بكل سهولة",
    desktopIntro: "مرحبًا بك مجددًا. يرجى تسجيل الدخول للوصول إلى لوحة التحكم.",
    heroTitle: "مستقبل الرعاية الصحية بين يديك",
    heroText: "نظام متكامل يربط الأطباء بالمرضى ويسهل إدارة العمليات الطبية بدقة وسهولة.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    fullName: "الاسم الكامل",
    phone: "رقم الجوال",
    remember: "تذكرني",
    forgot: "نسيت كلمة المرور؟",
    login: "تسجيل الدخول",
    register: "إنشاء الحساب",
    demoTitle: "الحسابات التجريبية",
    demoFast: "أو الدخول السريع بحساب تجريبي",
    noAccount: "ليس لديك حساب؟",
    createNow: "أنشئ حسابًا الآن",
    hasAccount: "لديك حساب؟",
    signInNow: "سجل الدخول",
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    contact: "اتصل بنا",
    lang: "اللغة:",
    copyright: "© ٢٠٢٤ عيادتي. جميع الحقوق محفوظة",
    doctors: "طبيب مسجل",
    clinics: "عيادة نشطة",
    support: "دعم فني",
    admin: "مدير النظام",
    doctor: "طبيب",
    staff: "موظف استقبال",
    patient: "مريض",
  },
  en: {
    app: "My Clinic",
    portal: "Clinic management system",
    welcome: "Welcome back",
    intro: "Sign in to manage your clinic smoothly",
    desktopIntro: "Welcome back. Sign in to access the control panel.",
    heroTitle: "The future of healthcare is in your hands",
    heroText: "An integrated system that connects doctors with patients and simplifies medical operations.",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    phone: "Mobile number",
    remember: "Remember me",
    forgot: "Forgot password?",
    login: "Sign in",
    register: "Create account",
    demoTitle: "Demo accounts",
    demoFast: "Or quick sign in with a demo account",
    noAccount: "No account?",
    createNow: "Create one now",
    hasAccount: "Already have an account?",
    signInNow: "Sign in",
    privacy: "Privacy policy",
    terms: "Terms of service",
    contact: "Contact us",
    lang: "Language:",
    copyright: "© 2024 My Clinic. All rights reserved",
    doctors: "Registered doctors",
    clinics: "Active clinics",
    support: "Support",
    admin: "System admin",
    doctor: "Doctor",
    staff: "Reception",
    patient: "Patient",
  },
} as const;

const DEMO_ACCOUNTS = [
  { role: "admin", labelKey: "admin", icon: ShieldCheck },
  { role: "doctor", labelKey: "doctor", icon: BriefcaseMedical },
  { role: "staff", labelKey: "staff", icon: Headset },
  { role: "patient", labelKey: "patient", icon: CircleUserRound },
] as const;

type DemoRole = (typeof DEMO_ACCOUNTS)[number]["role"];

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-[#12998f] text-white shadow-[0_12px_24px_rgba(18,153,143,0.2)]",
        compact ? "h-10 w-10" : "h-14 w-14 xl:h-16 xl:w-16"
      )}
    >
      <Stethoscope size={compact ? 23 : 34} strokeWidth={2.5} />
    </div>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const { t, theme, locale, toggleTheme, toggleLocale } = useUi();
  const labels = text[locale];
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [activeDemo, setActiveDemo] = useState<DemoRole | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const finishLogin = (user: { role: string }) => {
    refetch();
    navigate(user.role === "patient" ? "/patient" : "/admin");
  };

  const login = trpc.auth.login.useMutation({ onSuccess: finishLogin });
  const demoLogin = trpc.auth.demoLogin.useMutation({
    onSuccess: finishLogin,
    onSettled: () => setActiveDemo(null),
  });
  const register = trpc.auth.registerPatient.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/patient");
    },
  });

  const pending = login.isPending || register.isPending || demoLogin.isPending;
  const error = login.error?.message || register.error?.message || demoLogin.error?.message;

  const fieldClass =
    "h-12 w-full rounded-2xl border border-[#b9c9c7] bg-white px-4 text-sm text-[#0f172a] outline-none placeholder:text-[#8c9a99] focus:border-[#12998f] focus:ring-4 focus:ring-[#12998f]/10 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

  const form = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (mode === "login") login.mutate({ email, password });
        else register.mutate({ fullName, email, phone, password });
      }}
      className="space-y-4"
    >
      {mode === "register" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#0f172a] dark:text-slate-200">{labels.fullName}</span>
            <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[#0f172a] dark:text-slate-200">{labels.phone}</span>
            <input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="05xxxxxxxx" className={fieldClass} />
          </label>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm text-[#0f172a] dark:text-slate-200">{labels.email}</span>
        <span className="relative block">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@clinic.com"
            className={cn(fieldClass, "pl-12 pr-4 text-center")}
          />
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64716f] dark:text-slate-400" />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm text-[#0f172a] dark:text-slate-200">{labels.password}</span>
        <span className="relative block">
          <input
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className={cn(fieldClass, "pl-12 pr-4 text-center")}
          />
          <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64716f] dark:text-slate-400" />
          <Eye className="absolute right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#64716f] dark:text-slate-400 lg:block" />
        </span>
      </label>

      {mode === "login" && (
        <div className="flex items-center justify-between px-1 text-sm">
          <button type="button" className="font-medium text-[#12998f] hover:underline">
            {labels.forgot}
          </button>
          <button type="button" onClick={() => setRememberMe((value) => !value)} className="flex items-center gap-2 text-[#0f172a] dark:text-slate-200">
            <span>{labels.remember}</span>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-md border transition",
                rememberMe ? "border-[#12998f] bg-[#12998f] text-white" : "border-[#b9c9c7] bg-white dark:border-slate-600 dark:bg-slate-900"
              )}
            >
              {rememberMe && <Check size={13} />}
            </span>
          </button>
        </div>
      )}

      {error && <p className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#12998f] text-lg font-bold text-white shadow-[0_10px_18px_rgba(18,153,143,0.18)] transition hover:bg-[#0f8f86] active:scale-[0.99] disabled:opacity-60"
      >
        <span>{pending ? t("processing") : mode === "login" ? labels.login : labels.register}</span>
        <LogIn size={20} />
      </button>
    </form>
  );

  const demoGrid = (mobile = false) => (
    <div className={cn("login-demo-grid grid grid-cols-2", mobile ? "gap-3" : "gap-4")}>
      {DEMO_ACCOUNTS.map((account) => {
        const Icon = account.icon;
        const isLoading = activeDemo === account.role && demoLogin.isPending;
        return (
          <button
            key={account.role}
            type="button"
            disabled={pending}
            onClick={() => {
              setActiveDemo(account.role);
              demoLogin.mutate({ role: account.role });
            }}
            className={cn(
              "group flex flex-col items-center justify-center border border-[#c6d2d0] bg-white transition hover:border-[#12998f] active:scale-[0.98] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900",
              mobile ? "h-28 rounded-2xl" : "h-28 rounded-2xl bg-[#eef3ff] dark:bg-slate-800",
              isLoading && "border-[#12998f] bg-[#e0f5f2] dark:bg-teal-950"
            )}
          >
            <span
              className={cn(
                "mb-2.5 flex items-center justify-center rounded-full bg-white text-[#0f172a] shadow-sm transition group-hover:bg-[#12998f] group-hover:text-white dark:bg-slate-950 dark:text-slate-100",
                mobile ? "h-12 w-12 text-[#12998f]" : "h-11 w-11"
              )}
            >
              <Icon size={mobile ? 22 : 20} strokeWidth={2.2} />
            </span>
            <span className={cn("font-bold text-[#0f172a] dark:text-slate-100", mobile ? "text-base" : "text-sm")}>
              {isLoading ? t("processing") : labels[account.labelKey]}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <main className="min-h-[100svh] bg-[#f7f8fb] text-[#0f172a] dark:bg-[#071112] dark:text-slate-100">
      <div dir="ltr" className="login-desktop-shell min-h-[calc(100svh-64px)] w-full grid-cols-2">
        <section dir="rtl" className="relative flex min-w-0 flex-col bg-[#f7f8fb] px-8 py-7 dark:bg-[#071112] xl:px-16">
          <div className="mb-8 flex items-center gap-3">
            <button type="button" onClick={toggleLocale} className="flex h-10 items-center gap-1 rounded-full bg-[#dfe8ff] px-3 text-sm text-[#0f172a] dark:bg-slate-800 dark:text-slate-100">
              {locale === "ar" ? "EN" : "AR"}
              <Globe2 size={16} />
            </button>
            <button type="button" onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfe8ff] text-[#0f172a] dark:bg-slate-800 dark:text-slate-100">
              <ThemeIcon size={20} />
            </button>
          </div>

          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-4">
              <div className="text-right">
                <h1 className="font-display text-3xl font-extrabold leading-none text-[#12998f] xl:text-4xl">{labels.app}</h1>
                <p className="mt-1 text-xs text-[#64716f] dark:text-slate-400">{labels.portal}</p>
              </div>
              <LogoMark />
            </div>
            <p className="text-base text-[#0f172a] dark:text-slate-200">{labels.desktopIntro}</p>
          </div>

          <div className="mx-auto w-full max-w-[500px]">
            <div className="rounded-3xl border border-[#d7dfdf] bg-[#f8f8ff] p-6 shadow-[0_18px_34px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900">
              {form}
            </div>

            {mode === "login" && (
              <>
                <div className="mb-5 mt-8 flex items-center justify-center gap-4">
                  <h2 className="text-xl font-bold text-[#0f172a] dark:text-slate-100">{labels.demoTitle}</h2>
                  <span className="h-1 w-14 rounded-full bg-[#12998f]" />
                </div>
                {demoGrid()}
              </>
            )}

            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-6 w-full text-center text-sm text-[#0f172a] dark:text-slate-200">
              {mode === "login" ? labels.noAccount : labels.hasAccount}{" "}
              <span className="font-bold text-[#12998f]">{mode === "login" ? labels.createNow : labels.signInNow}</span>
            </button>
          </div>
        </section>

        <section dir="rtl" className="relative flex min-w-0 items-center justify-center overflow-hidden bg-[#12998f]">
          <img src={CLINIC_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-[#12998f]/70 dark:bg-[#063d3a]/82" />
          <div className="relative z-10 w-[480px] max-w-[72%] rounded-[30px] border border-white/50 bg-[#e4f4f1]/90 px-12 py-10 text-center shadow-[0_26px_54px_rgba(15,23,42,0.24)] dark:border-teal-300/20 dark:bg-slate-900/75">
            <Stethoscope className="mx-auto mb-7 h-14 w-14 text-[#12998f] dark:text-teal-300" strokeWidth={2.5} />
            <h2 className="font-display text-3xl font-extrabold leading-[1.35] text-[#0f172a] dark:text-slate-100">{labels.heroTitle}</h2>
            <p className="mt-5 text-base leading-8 text-[#0f172a] dark:text-slate-200">{labels.heroText}</p>
          </div>
          <div className="absolute bottom-24 flex items-center gap-9 text-white">
            {[
              ["٥٠٠+", labels.doctors],
              ["١٠٠+", labels.clinics],
              ["٢٤/٧", labels.support],
            ].map(([value, label], index) => (
              <div key={label} className="flex items-center gap-9">
                {index > 0 && <span className="h-10 w-px bg-white/25" />}
                <div className="text-center">
                  <p className="nums text-xl font-extrabold">{value}</p>
                  <p className="mt-1 text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="login-mobile-shell min-h-[100svh] flex-col">
        <header className="border-b border-[#c6d2d0] bg-[#f7f8fb] dark:border-slate-700 dark:bg-[#071112]">
          <div className="flex h-20 items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#b9c9c7] bg-white text-[#0f172a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <ThemeIcon size={20} />
              </button>
              <button type="button" onClick={toggleLocale} className="flex h-10 items-center gap-2 rounded-full border border-[#b9c9c7] bg-white px-4 text-sm font-semibold text-[#0f172a] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {locale === "ar" ? "EN" : "AR"}
                <Globe2 size={18} />
              </button>
            </div>
            <LogoMark compact />
          </div>
        </header>

        <section className="flex-1 bg-[radial-gradient(circle_at_bottom_right,rgba(18,153,143,0.08),transparent_38%),#f7f8fb] px-5 pb-9 pt-8 dark:bg-[radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.12),transparent_38%),#071112]">
          <div className="mb-7 text-center">
            <h1 className="font-display text-3xl font-extrabold leading-tight text-[#12998f]">{labels.welcome}</h1>
            <p className="mt-3 text-lg leading-7 text-[#0f172a] dark:text-slate-200">{labels.intro}</p>
          </div>

          <div className="rounded-3xl border border-[#c6d2d0] bg-white/95 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.1)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            {form}
          </div>

          {mode === "login" && (
            <>
              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-[#d4dcdb] dark:bg-slate-700" />
                <span className="text-center text-sm text-[#0f172a] dark:text-slate-200">{labels.demoFast}</span>
                <span className="h-px flex-1 bg-[#d4dcdb] dark:bg-slate-700" />
              </div>
              {demoGrid(true)}
            </>
          )}

          <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-7 w-full text-center text-base text-[#0f172a] dark:text-slate-200">
            {mode === "login" ? labels.noAccount : labels.hasAccount}{" "}
            <span className="font-bold text-[#12998f]">{mode === "login" ? labels.createNow : labels.signInNow}</span>
          </button>
        </section>
      </div>

      <footer className="border-t border-[#c6d2d0] bg-white px-6 py-5 dark:border-slate-700 dark:bg-[#071112]">
        <div className="mx-auto hidden max-w-7xl items-center justify-between text-sm text-[#0f172a] dark:text-slate-200 lg:flex">
          <div className="flex items-center gap-3">
            <span>{labels.lang}</span>
            <button type="button" onClick={toggleLocale} className="flex items-center gap-2 font-semibold text-[#12998f]">
              {locale === "ar" ? "العربية" : "English"}
              <Globe2 size={16} />
            </button>
          </div>
          <p className="text-[#8c9695]">{labels.copyright}</p>
          <div className="flex items-center gap-8">
            <a href="#">{labels.privacy}</a>
            <a href="#">{labels.terms}</a>
            <a href="#">{labels.contact}</a>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 text-sm text-[#0f172a] dark:text-slate-200 lg:hidden">
          <LogoMark compact />
          <div className="flex items-center gap-5">
            <a href="#">{labels.privacy}</a>
            <a href="#">{labels.terms}</a>
            <a href="#">{labels.contact}</a>
          </div>
          <p className="text-[#8c9695]">{labels.copyright}</p>
        </div>
      </footer>
    </main>
  );
}
