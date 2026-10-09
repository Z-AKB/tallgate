interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-indigo-300 sm:text-sm">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white leading-[1.1] sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
