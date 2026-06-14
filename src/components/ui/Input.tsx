import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5 text-sm text-text shadow-sm backdrop-blur-sm placeholder:text-soft-gray focus:border-primary/30 focus:bg-white/80 focus:outline-none focus:ring-4 focus:ring-primary/10",
          error && "border-red-400",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
