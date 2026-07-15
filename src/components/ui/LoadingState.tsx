import Image from "next/image";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

/** Centered loading state with spinning ReadShelf mark + label. */
export function LoadingState({
  label = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3.5 py-16 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-primary/20 bg-[#fff1dc]/80" />
        <Image
          src="/logo.png"
          alt=""
          width={40}
          height={40}
          className="relative h-10 w-10 animate-spin rounded-lg object-cover [animation-duration:1.15s]"
          style={{
            filter:
              "sepia(0.55) saturate(1.45) hue-rotate(-22deg) brightness(0.95) contrast(1.08)",
          }}
          unoptimized
          aria-hidden
        />
      </span>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
