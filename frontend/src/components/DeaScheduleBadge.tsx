import type { DeaSchedule } from "@/types/drug";

const SCHEDULE_STYLES: Record<
  NonNullable<DeaSchedule>,
  { label: string; className: string }
> = {
  II: {
    label: "C-II",
    className:
      "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  },
  III: {
    label: "C-III",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  },
  IV: {
    label: "C-IV",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300",
  },
  V: {
    label: "C-V",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  },
};

interface DeaScheduleBadgeProps {
  schedule: DeaSchedule;
}

export function DeaScheduleBadge({ schedule }: DeaScheduleBadgeProps) {
  if (!schedule) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
        Non-controlled
      </span>
    );
  }

  const style = SCHEDULE_STYLES[schedule];
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
