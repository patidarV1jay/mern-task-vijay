import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [ready, setReady] = useState(false);

  function applyAuth(data) {
    setAccessToken(data.accessToken);
    setUser(data.user || null);
    if (data.tenant) {
      setTenant(data.tenant);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await authApi.refresh();
        if (cancelled) return;
        applyAuth(data);
        try {
          const me = await authApi.me(data.accessToken);
          if (!cancelled) {
            setUser(me.user);
            setTenant(me.tenant);
          }
        } catch {
          /* access token is enough to enter the app */
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          setTenant(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      tenant,
      ready,
      async register(payload) {
        const data = await authApi.register(payload);
        applyAuth(data);
        return data;
      },
      async login(payload) {
        const data = await authApi.login(payload);
        applyAuth(data);
        return data;
      },
      async logout() {
        try {
          await authApi.logout();
        } finally {
          setAccessToken(null);
          setUser(null);
          setTenant(null);
        }
      },
    }),
    [accessToken, user, tenant, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
