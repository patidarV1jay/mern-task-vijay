export default function MetricCard({
    title,
    value,
    subtitle,
    icon,
  }) {
    return (
      <div className="metric-card">
        <div className="metric-card-top">
          <div className="metric-icon">
            {icon}
          </div>
        </div>
  
        <div className="metric-content">
          <p>{title}</p>
  
          <h2>{value}</h2>
  
          {subtitle && (
            <span>{subtitle}</span>
          )}
        </div>
      </div>
    );
  }