import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-pine",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink focus:border-pine",
        className
      )}
      {...props}
    />
  );
}
