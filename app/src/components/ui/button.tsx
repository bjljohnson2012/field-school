import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-brand border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 ease-brand outline-none select-none focus-visible:outline-none focus-visible:[box-shadow:0_0_0_4px_color-mix(in_oklab,var(--ring)_25%,transparent)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:[box-shadow:0_0_0_4px_color-mix(in_oklab,var(--destructive)_25%,transparent)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-primary/90 hover:shadow-card-hover",
        outline:
          "border-input bg-card text-foreground hover:bg-muted hover:text-foreground",
        secondary:
          "border-primary/25 bg-card text-primary hover:border-primary/45 hover:bg-primary/5",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-primary-foreground shadow-sm hover:-translate-y-px hover:bg-destructive/90",
        link: "text-primary underline-offset-[3px] hover:underline",
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
