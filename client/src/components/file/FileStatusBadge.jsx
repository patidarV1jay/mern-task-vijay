export default function FileStatusBadge({
    status,
  }) {
    const config = {
      pending: {
        label: "Pending",
        className: "status-pending",
      },
  
      processing: {
        label: "Processing",
        className: "status-processing",
      },
  
      processed: {
        label: "Done",
        className: "status-processed",
      },
  
      failed: {
        label: "Failed",
        className: "status-failed",
      },
    };
  
    const item =
      config[status] || config.pending;
  
    return (
      <span
        className={`status-badge ${item.className}`}
      >
        <span className="status-dot" />
  
        {item.label}
      </span>
    );
  }