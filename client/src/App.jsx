import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Home from "./pages/Home.jsx";
import FileManager from "./pages/FileManager.jsx";
import Users from "./pages/Users.jsx";

import AppLayout from "./components/layout/AppLayout.jsx";

import "./styles/layout.css";

function GuestRoute({ children }) {
  const { ready, accessToken } = useAuth();

  if (!ready) {
    return (
      <div className="boot">
        Loading session…
      </div>
    );
  }

  if (accessToken) {
    return (
      <Navigate
        to="/app"
        replace
      />
    );
  }

  return children;
}

function ProtectedRoute({ children }) {
  const { ready, accessToken } = useAuth();

  if (!ready) {
    return (
      <div className="boot">
        Loading session…
      </div>
    );
  }

  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>

      {/* Public routes */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >

        <Route
          path="/app"
          element={<Home />}
        />

        <Route
          path="/upload"
          element={<FileManager />}
        />

        <Route
          path="/users"
          element={
          <Users />
          }
        />

        <Route
          path="/jobs"
          element={
            <div>
              <h1>Jobs</h1>
              <p>Jobs management coming soon.</p>
            </div>
          }
        />

        <Route
          path="/reports"
          element={
            <div>
              <h1>Reports</h1>
              <p>Reports coming soon.</p>
            </div>
          }
        />

      </Route>

      {/* Unknown route */}

      <Route
        path="*"
        element={
          <Navigate
            to="/app"
            replace
          />
        }
      />

    </Routes>
  );
}