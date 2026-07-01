import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "interactive-lift inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-light",
        variant === "secondary" &&
          "border border-white/70 bg-white/60 text-text shadow-sm hover:bg-white/85",
        variant === "ghost" && "text-text/80 hover:bg-white/45",
        variant === "danger" &&
          "bg-red-600 text-white shadow-sm hover:bg-red-700",
        variant === "danger-outline" &&
          "border border-red-500/70 bg-transparent text-red-600 hover:border-red-500 hover:bg-red-50/80",
        size === "sm" && "px-3.5 py-2 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className,
      )}
      {...props}
    />
  );
}
