interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="bg-highlight py-5">
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-8">
            {eyebrow && (
              <p className="text-uppercase fw-semibold text-primary small mb-2">
                {eyebrow}
              </p>
            )}
            <h1 className="display-6 fw-bold text-navy mb-3">{title}</h1>
            {description && (
              <p className="fs-5 text-muted-tg mb-0">{description}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
