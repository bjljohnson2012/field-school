import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-muted text-muted-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border bg-card text-foreground",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-[3px] hover:underline",
        success: "bg-pass/10 text-pass",
        warning: "bg-warn/15 text-warn",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
