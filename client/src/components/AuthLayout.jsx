export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="brand">
        <span className="mark">AF</span>
        <div>
          <p className="eyebrow">Alliance Fintech</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
