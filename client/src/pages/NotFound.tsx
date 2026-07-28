import { Link } from "wouter";
import { PulseLine } from "@/components/shared/PulseLine";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mist text-center">
      <PulseLine className="text-line" />
      <div>
        <h1 className="font-display text-xl font-bold text-ink">الصفحة غير موجودة</h1>
        <p className="mt-1 text-sm text-ink-soft">الرابط الذي حاولت الوصول إليه غير متاح</p>
      </div>
      <Link href="/" className="text-sm font-medium text-pine hover:underline">
        العودة للرئيسية
      </Link>
    </div>
  );
}
