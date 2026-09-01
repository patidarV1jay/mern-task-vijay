import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user, tenant, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>Alliance Fintech</strong>
        <button className="ghost" type="button" onClick={logout}>
          Log out
        </button>
      </header>
      <main className="panel">
        <h1>You are signed in</h1>
        <p className="muted">
          Access token is kept in memory. The refresh token lives in an HTTP-only cookie
          and is rotated on each refresh.
        </p>
        <dl className="meta">
          <div>
            <dt>Owner</dt>
            <dd>
              {user?.fullName} · {user?.email}
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user?.role}</dd>
          </div>
          <div>
            <dt>Tenant</dt>
            <dd>{tenant?.name || user?.tenantId}</dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
