import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-masthead">
      <p className="masthead-kicker">
        <span className="system-seal" aria-hidden="true">
          MM
        </span>
        <span>MonMag</span>
        <span aria-hidden="true">/</span>
        <span>{title}</span>
      </p>
      <div className="masthead-body">
        <div className="masthead-heading">
          <h1 className="masthead-title">{title}</h1>
          {description ? <p className="masthead-description">{description}</p> : null}
        </div>
        {actions ? <div className="masthead-actions">{actions}</div> : null}
      </div>
      <div className="masthead-rule" aria-hidden="true" />
    </header>
  );
}
