import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-brand border border-input bg-card px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-200 ease-brand outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:[box-shadow:0_0_0_4px_color-mix(in_oklab,var(--ring)_15%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:[box-shadow:0_0_0_4px_color-mix(in_oklab,var(--destructive)_25%,transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
