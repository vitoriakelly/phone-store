import type { LucideIcon } from 'lucide-react';

import './styles.scss';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  variant?: 'blue' | 'green' | 'yellow' | 'purple';
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  variant = 'blue',
}: SummaryCardProps) {
  return (
    <article className="summary-card">
      <div
        className={`summary-card__icon summary-card__icon--${variant}`}
      >
        <Icon size={24} />
      </div>

      <div className="summary-card__content">
        <span className="summary-card__title">{title}</span>
        <strong className="summary-card__value">{value}</strong>
        <small className="summary-card__description">
          {description}
        </small>
      </div>
    </article>
  );
}