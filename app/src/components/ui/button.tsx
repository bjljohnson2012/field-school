import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-brand border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-brand outline-none select-none focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-primary/90 hover:shadow-card-hover focus-visible:ring-primary/25",
        outline:
          "border-input bg-card text-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/15",
        secondary:
          "border-primary/25 bg-card text-primary hover:border-primary/45 hover:bg-primary/5 focus-visible:ring-primary/15",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-border",
        destructive:
          "bg-destructive text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-destructive/90 focus-visible:ring-destructive/25",
        link: "text-primary underline-offset-[3px] hover:underline focus-visible:ring-primary/15",
      },
      size: {
        default: "px-5 py-2.5",
        xs: "rounded-md px-2.5 py-1 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "px-3 py-1.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "px-6 py-3",
        icon: "size-10",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
