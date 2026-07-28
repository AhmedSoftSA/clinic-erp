import { cn } from "@/lib/utils";

/**
 * عنصر التوقيع البصري للنظام: "خط النبض".
 * يُستخدم كمؤشر حي (live) بجانب الطابور، وحالة الأطباء المتاحين،
 * وكأيقونة للحالات الفارغة — إشارة بصرية واحدة تتكرر بثبات
 * بدل شعار تقليدي، وتربط الواجهة بطبيعة العمل الطبي نفسه.
 */
export function PulseLine({
  className,
  live = false,
}: {
  className?: string;
  live?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 32"
      className={cn("w-10 h-4", live && "animate-pulse-line", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 16 H30 L38 4 L48 28 L56 16 H70 L76 22 L82 16 H120"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
