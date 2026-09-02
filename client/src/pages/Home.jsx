import { useEffect } from "react";
import "../styles/dashboard.css"
import { useDashboardStore } from "../store/dashboardStore.js";
import MetricCard from "../components/MetricCard.jsx";
import FilesUploadedChart from "../components/Chart.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLocation } from "react-router-dom";

const formatBytes = (bytes = 0) => {
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
};

function FileIcon() {
  return <span>📁</span>;
}

function StorageIcon() {
  return <span>💾</span>;
}

function UsersIcon() {
  return <span>👥</span>;
}

function JobsIcon() {
  return <span>⚙️</span>;
}

export default function Dashboard() {
  const { accessToken, user } = useAuth();
  console.log(user,'we arehere')
  const location = useLocation();
  const { summary, loading, error, fetchSummary } = useDashboardStore();

  useEffect(() => {
    if (accessToken ) {
      fetchSummary(accessToken);
    }
  }, [accessToken, location.pathname]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 >Dashboard</h1>
            <p>Overview of your file processing system</p>
          </div>
        </div>

        <div className="metrics-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="metric-card skeleton-card" key={item}>
              <div className="skeleton skeleton-icon" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-value" />
            </div>
          ))}
        </div>

        <div className="dashboard-chart-card skeleton-chart">
          Loading chart...
        </div>
      </div>
    );
  }

  if(user.role==='viewer' || user.role ==='editor'){
    return(
      <div className="dashboard">
        <p>Hello {user.fullName}</p>
      </div>
    )

  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>

          <button onClick={() => fetchSummary(accessToken)}>Try again</button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }
  console.log(user)
   

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>Overview of your file processing system</p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total files"
          value={summary.totalFiles}
          subtitle="Files in your tenant"
          icon={<FileIcon />}
        />

        <MetricCard
          title="Storage used"
          value={formatBytes(summary.storageUsed)}
          subtitle="Total file storage"
          icon={<StorageIcon />}
        />

        <MetricCard
          title="Active users"
          value={summary.activeUsers}
          subtitle="Users in your tenant"
          icon={<UsersIcon />}
        />

        <MetricCard
          title="Jobs queued"
          value={summary.jobsQueued}
          subtitle="Currently processing"
          icon={<JobsIcon />}
        />
      </div>

      {/* Chart */}
      <FilesUploadedChart data={summary.uploadsPerDay} />
    </div>
  );
}
