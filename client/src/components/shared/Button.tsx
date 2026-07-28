import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        variant === "primary" && "bg-pine text-white hover:bg-pine-dark",
        variant === "secondary" && "border border-line bg-paper text-ink hover:bg-mist",
        variant === "ghost" && "text-ink-soft hover:bg-mist hover:text-ink",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        className
      )}
      {...props}
    />
  );
}
