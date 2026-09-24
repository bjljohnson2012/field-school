import { buttonVariants } from "@/components/ui/button"

function EmptyState({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: { label: string; href: string }
}) {
  return (
    <div
      data-slot="empty-state"
      className="rounded-card border border-border bg-card px-6 py-10 text-center shadow-card"
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-section mt-2">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        <a className={buttonVariants({ variant: "secondary", className: "mt-5" })} href={action.href}>
          {action.label}
        </a>
      ) : null}
    </div>
  )
}

export { EmptyState }
