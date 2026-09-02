import {
    LayoutDashboard,
    FolderOpen,
    Users,
    ListTodo,
    BarChart3,
    LogOut,
  } from "lucide-react";
  
  import { NavLink, useNavigate } from "react-router-dom";
  import { useAuth } from "../../context/AuthContext.jsx";
  
  export default function Sidebar() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const menuItems = [
      {
        label: "Dashboard",
        path: "/app",
        icon: LayoutDashboard,
      },
      {
        label: "Files",
        path: "/upload",
        icon: FolderOpen,
      },
    
      ...(user.role === "admin" || user.role === "owner"
        ? [
            {
              label: "Users",
              path: "/users",
              icon: Users,
            },
          ]
        : []),
    ];
  
    const handleLogout = async () => {
      await logout();
      navigate("/login", { replace: true });
    };
  
    return (
      <aside className="sidebar">
  
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <FolderOpen size={20} />
            </div>
  
            <span>FileFlow</span>
          </div>
        </div>
  
        {/* Navigation */}
        <nav className="sidebar-nav">
  
          <p className="sidebar-section-title">
            Workspace
          </p>
  
          {menuItems.map((item) => {
            const Icon = item.icon;
  
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/app"}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive
                      ? "sidebar-link-active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />
  
                <span>{item.label}</span>
              </NavLink>
            );
          })}
  
        </nav>
  
        {/* Logout */}
        <div className="sidebar-bottom">
  
          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
  
            <span>Logout</span>
          </button>
  
        </div>
  
      </aside>
    );
  }