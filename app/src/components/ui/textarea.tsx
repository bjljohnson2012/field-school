import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content flex min-h-24 w-full rounded-brand border border-input bg-card px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-200 ease-brand outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:[box-shadow:0_0_0_4px_color-mix(in_oklab,var(--ring)_15%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:[box-shadow:0_0_0_4px_color-mix(in_oklab,var(--destructive)_25%,transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
