"use client";

import { useEffect, useMemo, useState } from "react";
import type { GlobalUser, AuditLogEntry } from "@/lib/mockData";

type UserManagementProps = {
  users: GlobalUser[];
  userFilter: "all" | "active" | "inactive";
  onFilterChange: (filter: "all" | "active" | "inactive") => void;
  auditLog: AuditLogEntry[];
  expandedAuditLog: boolean;
  onToggleAuditLog: () => void;
  onSelectUser?: (userId: string) => void;
};

export function UserManagement({
  users,
  userFilter,
  onFilterChange,
  auditLog,
  expandedAuditLog,
  onToggleAuditLog,
  onSelectUser,
}: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, GlobalUser["role"]>>({});
  const [localAuditLog, setLocalAuditLog] = useState<AuditLogEntry[]>(auditLog);
  const [inviteDraft, setInviteDraft] = useState({
    name: "",
    email: "",
    role: "SITE_MANAGER" as GlobalUser["role"],
    site: "Alpha",
  });

  useEffect(() => {
    setLocalAuditLog(auditLog);
  }, [auditLog]);

  const visibleAuditLog = useMemo(() => localAuditLog, [localAuditLog]);

  const filteredUsers = users.filter((u) => {
    if (userFilter === "active") return u.status === "ACTIVE";
    if (userFilter === "inactive") return u.status === "INACTIVE";
    return true;
  });

  const getRoleBadgeColor = (role: GlobalUser["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { bg: "rgba(229, 57, 53, 0.15)", color: "#e53935" };
      case "SITE_MANAGER":
        return { bg: "rgba(255, 109, 0, 0.15)", color: "#ff6d00" };
      case "FLEET_OPERATOR":
        return { bg: "rgba(255, 193, 7, 0.15)", color: "#ffc107" };
      case "TRUCK_OPERATOR":
        return { bg: "rgba(41, 121, 255, 0.15)", color: "#2979ff" };
      case "MAINTENANCE_TECH":
        return { bg: "rgba(0, 200, 83, 0.15)", color: "#00c853" };
      case "ANALYST":
        return { bg: "rgba(156, 163, 175, 0.15)", color: "#9ca3af" };
    }
  };

  const resolveRole = (user: GlobalUser) => roleOverrides[user.id] ?? user.role;

  const handleRoleChange = (user: GlobalUser, nextRole: GlobalUser["role"]) => {
    setRoleOverrides((current) => ({ ...current, [user.id]: nextRole }));
    setLocalAuditLog((current) => [
      {
        id: `audit-${Date.now()}-${user.id}`,
        timestamp: new Date().toISOString(),
        action: "ROLE_CHANGE",
        userId: "u1",
        userName: "A. Morgan",
        targetUser: user.id,
        details: `Changed ${user.name} from ${resolveRole(user)} to ${nextRole} at ${user.site} site`,
      },
      ...current,
    ]);
  };

  return (
    <div className="user-management">
      <div className="user-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${userFilter === "all" ? "active" : ""}`}
            onClick={() => onFilterChange("all")}
          >
            All ({users.length})
          </button>
          <button
            className={`filter-btn ${userFilter === "active" ? "active" : ""}`}
            onClick={() => onFilterChange("active")}
          >
            Active ({users.filter((u) => u.status === "ACTIVE").length})
          </button>
          <button
            className={`filter-btn ${userFilter === "inactive" ? "active" : ""}`}
            onClick={() => onFilterChange("inactive")}
          >
            Inactive ({users.filter((u) => u.status === "INACTIVE").length})
          </button>
        </div>
        <button className="invite-btn" onClick={() => setShowInviteForm(true)}>
          + Invite User
        </button>
      </div>

      {showInviteForm && (
        <div className="invite-modal" onClick={() => setShowInviteForm(false)}>
          <div className="invite-card" onClick={(event) => event.stopPropagation()}>
            <div className="audit-header">
              <span className="audit-action">INVITE USER</span>
              <button className="action-btn" onClick={() => setShowInviteForm(false)}>
                ✕
              </button>
            </div>
            <p className="audit-details">Create a new HQ-managed account and assign role and site access.</p>
            <form
              className="invite-form"
              onSubmit={(event) => {
                event.preventDefault();
                setLocalAuditLog((current) => [
                  {
                    id: `invite-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    action: "USER_CREATED",
                    userId: "u1",
                    userName: "A. Morgan",
                    targetUser: inviteDraft.email,
                    details: `Invited ${inviteDraft.name || inviteDraft.email} as ${inviteDraft.role} for ${inviteDraft.site}`,
                  },
                  ...current,
                ]);
                setInviteDraft({ name: "", email: "", role: "SITE_MANAGER", site: "Alpha" });
                setShowInviteForm(false);
              }}
            >
              <input
                placeholder="Full name"
                value={inviteDraft.name}
                onChange={(event) => setInviteDraft((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                placeholder="Email address"
                value={inviteDraft.email}
                onChange={(event) => setInviteDraft((current) => ({ ...current, email: event.target.value }))}
              />
              <select
                value={inviteDraft.role}
                onChange={(event) => setInviteDraft((current) => ({ ...current, role: event.target.value as GlobalUser["role"] }))}
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="SITE_MANAGER">SITE_MANAGER</option>
                <option value="FLEET_OPERATOR">FLEET_OPERATOR</option>
                <option value="TRUCK_OPERATOR">TRUCK_OPERATOR</option>
                <option value="MAINTENANCE_TECH">MAINTENANCE_TECH</option>
                <option value="ANALYST">ANALYST</option>
              </select>
              <input
                placeholder="Site"
                value={inviteDraft.site}
                onChange={(event) => setInviteDraft((current) => ({ ...current, site: event.target.value }))}
              />
              <div className="invite-actions">
                <button type="button" className="filter-btn" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="invite-btn">
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>EMAIL</th>
            <th>ROLE</th>
            <th>SITE</th>
            <th>LAST LOGIN</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const role = resolveRole(user);
            const roleColors = getRoleBadgeColor(role);
            return (
              <tr
                key={user.id}
                className={selectedUser === user.id ? "selected" : ""}
                onClick={() => {
                  setSelectedUser(user.id);
                  onSelectUser?.(user.id);
                }}
              >
                <td className="name-cell">
                  <div className="user-avatar">{user.name.charAt(0)}</div>
                  <div className="user-name">{user.name}</div>
                </td>
                <td className="email-cell">{user.email}</td>
                <td>
                  <div className="role-cell">
                    <span
                      className="role-badge"
                      style={{
                        background: roleColors?.bg,
                        color: roleColors?.color,
                      }}
                    >
                      {role}
                    </span>
                    <select
                      className="role-select"
                      value={role}
                      onChange={(event) => handleRoleChange(user, event.target.value as GlobalUser["role"])}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="SITE_MANAGER">SITE_MANAGER</option>
                      <option value="FLEET_OPERATOR">FLEET_OPERATOR</option>
                      <option value="TRUCK_OPERATOR">TRUCK_OPERATOR</option>
                      <option value="MAINTENANCE_TECH">MAINTENANCE_TECH</option>
                      <option value="ANALYST">ANALYST</option>
                    </select>
                  </div>
                </td>
                <td className="site-cell">{user.site}</td>
                <td className="timestamp-cell">{new Date(user.lastLogin).toLocaleTimeString()}</td>
                <td className="status-cell">
                  <span className={`status-indicator ${user.status.toLowerCase()}`}>{user.status}</span>
                </td>
                <td className="actions-cell">
                  <button className="action-btn" title="Edit" onClick={(event) => event.stopPropagation()}>
                    ✎
                  </button>
                  <button className="action-btn" title="Deactivate" onClick={(event) => event.stopPropagation()}>
                    ⊘
                  </button>
                  <button className="action-btn" title="Reset Password" onClick={(event) => event.stopPropagation()}>
                    🔑
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Audit Log Collapsible */}
      <div className="audit-log-section">
        <button className="audit-toggle" onClick={onToggleAuditLog}>
          {expandedAuditLog ? "▼" : "▶"} Role Change Audit Log
        </button>

        {expandedAuditLog && (
          <div className="audit-log-content">
            {visibleAuditLog.map((entry) => (
              <div key={entry.id} className="audit-entry">
                <div className="audit-header">
                  <span className="audit-action">{entry.action}</span>
                  <span className="audit-time">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <p className="audit-details">
                  {entry.userName} {entry.action === "ROLE_CHANGE" ? "changed" : ""} {entry.details}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .user-management {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-buttons {
          display: flex;
          gap: 6px;
        }

        .filter-btn {
          padding: 6px 10px;
          font-size: 10px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 3px;
          color: var(--text2);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          font-family: var(--mono);
        }

        .filter-btn:hover {
          border-color: var(--border2);
        }

        .filter-btn.active {
          background: rgba(245, 200, 0, 0.15);
          border-color: var(--yellow);
          color: var(--yellow);
        }

        .invite-btn {
          padding: 6px 12px;
          font-size: 10px;
          background: var(--yellow);
          color: #000;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
        }

        .invite-btn:hover {
          background: var(--yellow2);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          max-height: 300px;
          overflow-y: auto;
          display: block;
          overflow-x: auto;
        }

        .users-table thead {
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--card);
        }

        .users-table th {
          text-align: left;
          padding: 8px;
          color: var(--text2);
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .users-table tbody {
          display: block;
          max-height: 280px;
          overflow-y: auto;
        }

        .users-table thead,
        .users-table tbody tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }

        .users-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: all 0.2s;
        }

        .users-table tbody tr:hover {
          background: rgba(245, 200, 0, 0.02);
        }

        .users-table tbody tr.selected {
          background: rgba(245, 200, 0, 0.05);
        }

        .users-table td {
          padding: 8px;
          color: var(--text);
        }

        .name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--yellow);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 600;
        }

        .email-cell {
          font-size: 10px;
          color: var(--text2);
          font-family: var(--mono);
        }

        .role-badge {
          font-size: 9px;
          padding: 3px 6px;
          border-radius: 2px;
          font-weight: 600;
          display: inline-block;
        }

        .role-cell {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .role-select {
          width: 100%;
          font-size: 9px;
          color: var(--text);
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 4px 6px;
          font-family: var(--mono);
        }

        .site-cell {
          font-size: 10px;
          color: var(--text2);
        }

        .timestamp-cell {
          font-size: 9px;
          color: var(--text3);
          font-family: var(--mono);
        }

        .status-cell {
          text-align: center;
        }

        .status-indicator {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 2px;
          display: inline-block;
        }

        .status-indicator.active {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
        }

        .status-indicator.inactive {
          background: rgba(229, 57, 53, 0.15);
          color: #e53935;
        }

        .actions-cell {
          display: flex;
          gap: 4px;
          justify-content: center;
        }

        .action-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text2);
          width: 24px;
          height: 24px;
          border-radius: 2px;
          cursor: pointer;
          font-size: 10px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(245, 200, 0, 0.15);
          border-color: var(--yellow);
          color: var(--yellow);
        }

        .invite-modal {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(8px);
        }

        .invite-card {
          width: min(520px, calc(100vw - 28px));
          border: 1px solid var(--border);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(19, 22, 28, 0.98), rgba(12, 14, 18, 0.98));
          padding: 18px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
        }

        .invite-form {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .invite-form input,
        .invite-form select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg2);
          color: var(--text);
          font-family: var(--sans);
        }

        .invite-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .audit-log-section {
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-top: 8px;
        }

        .audit-toggle {
          width: 100%;
          padding: 8px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 3px;
          color: var(--text2);
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          text-align: left;
          transition: all 0.2s;
        }

        .audit-toggle:hover {
          border-color: var(--border2);
          background: rgba(245, 200, 0, 0.02);
        }

        .audit-log-content {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .audit-entry {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 8px;
          font-size: 10px;
        }

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .audit-action {
          color: var(--yellow);
          font-weight: 700;
          font-family: var(--mono);
        }

        .audit-time {
          color: var(--text3);
          font-family: var(--mono);
        }

        .audit-details {
          color: var(--text2);
          margin: 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
