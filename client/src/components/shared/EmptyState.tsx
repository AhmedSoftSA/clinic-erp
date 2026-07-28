import { PulseLine } from "./PulseLine";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <PulseLine className="text-line" />
      <div>
        <p className="font-display font-bold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
    </div>
  );
}
