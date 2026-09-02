import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
  } from "recharts";
  
  export default function FilesUploadedChart({ data = [] }) {
    return (
      <div className="dashboard-chart-card">
        <div className="chart-header">
          <div>
            <h2>Files uploaded</h2>
            <p>Daily uploads over the last 30 days</p>
          </div>
  
          <div className="chart-period">
            Last 30 days
          </div>
        </div>
  
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="uploadGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#6366f1"
                    stopOpacity={0.3}
                  />
  
                  <stop
                    offset="100%"
                    stopColor="#6366f1"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
  
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
  
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickMargin={10}
              />
  
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                width={35}
              />
  
              <Tooltip
                cursor={{
                  stroke: "#6366f1",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                contentStyle={{
                  border: "none",
                  borderRadius: "10px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                  padding: "10px 14px",
                }}
                labelStyle={{
                  color: "#111827",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                formatter={(value) => [
                  `${value} files`,
                  "Uploads",
                ]}
              />
  
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#uploadGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  strokeWidth: 3,
                  stroke: "#fff",
                }}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }