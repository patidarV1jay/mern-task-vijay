import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  MoreHorizontal,
  Shield,
  UserRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { usersApi } from "../api/users.js";

import "../styles/users.css";

const PAGE_SIZE = 10;

export default function Users() {
  const { accessToken, user } = useAuth();

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [role, setRole] = useState("");

  const [page, setPage] = useState(1);

  if(user.role ==='editor' || user.role==='viewer'){
    return(
      <div className="users-error">
       Forbidden
    </div>
    )
    
  }

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
  
      const response = await usersApi.list({
        page,
        limit: PAGE_SIZE,
        search,
        role,
      });
  
      // Axios response
      const data = response.data;

  
      setUsers(data.data);
  
      setPagination(data.pagination);
  
    } catch (error) {
      console.error(
        "Failed to load users:",
        error
      );
  
      setError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    role,
  ]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function handleRoleChange(event) {
    setRole(event.target.value);
    setPage(1);
  }

  function previousPage() {
    if (page > 1) {
      setPage((current) => current - 1);
    }
  }

  function nextPage() {
    if (
      page <
      pagination.totalPages
    ) {
      setPage((current) => current + 1);
    }
  }

  return (
    <div className="users-page">

      {/* Header */}

      <div className="users-header">

        <div>
          <div className="users-title-row">
            <div className="users-title-icon">
              <UsersIcon size={22} />
            </div>

            <div>
              <h1>Users</h1>

              <p>
                Manage users in your tenant
              </p>
            </div>
          </div>
        </div>

        <div className="users-count">
          <strong>
            {pagination.total}
          </strong>

          <span>total users</span>
        </div>

      </div>

      {/* Toolbar */}

      <div className="users-toolbar">

        <div className="user-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        <select
          value={role}
          onChange={handleRoleChange}
          className="role-filter"
        >
          <option value="">
            All roles
          </option>

          <option value="admin">
            Admin
          </option>

          <option value="editor">
            Editor
          </option>

          <option value="member">
            Member
          </option>
        </select>

      </div>

      {/* Error */}

      {error && (
        <div className="users-error">
          {error}
        </div>
      )}

      {/* Table */}

      <div className="users-card">

        <div className="users-table">

          <div className="users-table-header">
            <div>User</div>
            <div>Role</div>
            <div>Joined</div>
            <div>Status</div>
            <div></div>
          </div>

          {loading ? (
            <LoadingRows />
          ) : users.length === 0 ? (
            <EmptyUsers />
          ) : (
            users.map((user) => (
              <UserRow
                key={user._id}
                user={user}
              />
            ))
          )}

        </div>

      </div>

      {/* Pagination */}

      {!loading && pagination.total > 0 && (
        <div className="users-pagination">

          <span>
            Showing{" "}
            <strong>
              {(page - 1) * PAGE_SIZE + 1}
            </strong>
            {" "}–{" "}
            <strong>
              {Math.min(
                page * PAGE_SIZE,
                pagination.total
              )}
            </strong>
            {" "}of{" "}
            <strong>
              {pagination.total}
            </strong>
          </span>

          <div className="pagination-controls">

            <button
              onClick={previousPage}
              disabled={page <= 1}
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <div className="page-number">
              {page}
            </div>

            <button
              onClick={nextPage}
              disabled={
                page >=
                pagination.totalPages
              }
            >
              Next
              <ChevronRight size={17} />
            </button>

          </div>

        </div>
      )}

    </div>
  );
}


function UserRow({ user }) {
  const initials = getInitials(
    user.fullName
  );

  const isActive =
    user.isActive !== false;

  return (
    <div className="user-row">

      {/* User */}

      <div className="user-info">

        <div className="user-avatar">
          {initials}
        </div>

        <div className="user-details">

          <strong>
            {user.fullName || "Unknown user"}
          </strong>

          <span>
            {user.email}
          </span>

        </div>

      </div>

      {/* Role */}

      <div>
        <RoleBadge role={user.role} />
      </div>

      {/* Joined */}

      <div className="joined-date">
        {formatDate(user.createdAt)}
      </div>

      {/* Status */}

      <div>
        <span
          className={`user-status ${
            isActive
              ? "user-status-active"
              : "user-status-inactive"
          }`}
        >
          <span className="status-dot" />

          {isActive
            ? "Active"
            : "Inactive"}
        </span>
      </div>

      {/* Actions */}

      <div className="user-actions">

        <button
          type="button"
          className="user-action-button"
        >
          <MoreHorizontal size={19} />
        </button>

      </div>

    </div>
  );
}


/* =========================
   ROLE BADGE
========================= */

function RoleBadge({ role }) {
  const normalizedRole =
    role?.toLowerCase();

  if (normalizedRole === "owner") {
    return (
      <span className="role-badge role-owner">
        <Shield size={14} />
        Owner
      </span>
    );
  }

  if (normalizedRole === "admin") {
    return (
      <span className="role-badge role-admin">
        <Shield size={14} />
        Admin
      </span>
    );
  }

  return (
    <span className="role-badge role-member">
      <UserRound size={14} />
      Member
    </span>
  );
}


/* =========================
   LOADING
========================= */

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            className="user-row user-row-loading"
            key={index}
          >
            <div className="skeleton skeleton-user" />
            <div className="skeleton skeleton-small" />
            <div className="skeleton skeleton-small" />
            <div className="skeleton skeleton-small" />
            <div />
          </div>
        )
      )}
    </>
  );
}


/* =========================
   EMPTY
========================= */

function EmptyUsers() {
  return (
    <div className="users-empty">

      <div className="empty-icon">
        <UsersIcon size={25} />
      </div>

      <h3>
        No users found
      </h3>

      <p>
        Try changing your search or
        role filter.
      </p>

    </div>
  );
}


function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) => part[0]?.toUpperCase()
    )
    .join("");
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}