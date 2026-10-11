import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <section className="page-heading no-print">
    <div className="site-width grid gap-6 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="min-w-0"><p className="eyebrow text-shell-accent">{eyebrow}</p><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-shell-muted sm:text-base">{description}</p></div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  </section>;
}