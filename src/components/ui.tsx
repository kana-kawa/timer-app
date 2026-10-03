import Link from "next/link";
import { BackIcon } from "./Icons";

export function PageTitle({
  children,
  backHref,
  action,
}: {
  children: React.ReactNode;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        {backHref && (
          <Link
            href={backHref}
            className="-ml-2 rounded-lg p-1.5 text-muted hover:text-foreground"
            aria-label="戻る"
          >
            <BackIcon className="size-5" />
          </Link>
        )}
        <h1 className="text-xl font-semibold">{children}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-break" : "bg-surface-muted ring-1 ring-border ring-inset"
      }`}
    >
      <span
        className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export const buttonStyles = {
  primary:
    "rounded-xl bg-foreground px-5 py-3 font-semibold text-background transition active:scale-[0.98] disabled:opacity-40",
  secondary:
    "rounded-xl border border-border bg-surface px-5 py-3 font-medium transition hover:bg-surface-muted active:scale-[0.98]",
  danger:
    "rounded-xl border border-work/40 px-5 py-3 font-medium text-work transition hover:bg-work-soft active:scale-[0.98]",
};
