import { cn } from "../lib/cn";

interface SlotlyLogoProps {
  className?: string;
  variant?: "full" | "icon";
  mode?: "auto" | "original" | "white";
  alt?: string;
}

export function SlotlyLogo({
  className,
  variant = "full",
  mode = "auto",
  alt = "Slotly",
}: SlotlyLogoProps) {
  if (variant === "icon") {
    if (mode === "original") {
      return (
        <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
          <img src="/slotly-icon.png" alt={alt} className="size-full object-contain" />
        </span>
      );
    }
    if (mode === "white") {
      return (
        <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
          <img src="/slotly-icon-white.png" alt={alt} className="size-full object-contain" />
        </span>
      );
    }
    return (
      <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
        <img
          src="/slotly-icon.png"
          alt={alt}
          className="size-full object-contain dark:hidden"
        />
        <img
          src="/slotly-icon-white.png"
          alt={alt}
          className="hidden size-full object-contain dark:block"
        />
      </span>
    );
  }

  if (mode === "original") {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)}>
        <img src="/slotly-logo.png" alt={alt} className="h-full w-auto object-contain" />
      </span>
    );
  }
  if (mode === "white") {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)}>
        <img src="/slotly-logo-white.png" alt={alt} className="h-full w-auto object-contain" />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src="/slotly-logo.png"
        alt={alt}
        className="h-full w-auto object-contain dark:hidden"
      />
      <img
        src="/slotly-logo-white.png"
        alt={alt}
        className="hidden h-full w-auto object-contain dark:block"
      />
    </span>
  );
}
