import React, { useEffect, useState } from 'react';
import ApiService from '../utils/api';
import '../styles/admin.css';

const defaultSecurityPolicy = { mfaRequired: false, ssoRequired: false, allowedAuthMethods: ['password'] };

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [rolesMatrix, setRolesMatrix] = useState({});
  const [securityPolicy, setSecurityPolicy] = useState(defaultSecurityPolicy);
  const [retention, setRetention] = useState({ retentionDays: 365, complianceSettings: {} });
  const [auditLogs, setAuditLogs] = useState([]);
  const [legalHolds, setLegalHolds] = useState([]);
  const [holdForm, setHoldForm] = useState({ scopeType: 'conversation', scopeId: '', reason: '' });
  const [exportResult, setExportResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, securityRes, retentionRes, auditRes, holdsRes] = await Promise.all([
        ApiService.getAdminUsers(),
        ApiService.getAdminRoles(),
        ApiService.getSecurityPolicies(),
        ApiService.getRetentionPolicy(),
        ApiService.getAuditLogs({ limit: 20 }),
        ApiService.getLegalHolds()
      ]);
      setUsers(usersRes || []);
      setRolesMatrix(rolesRes || {});
      setSecurityPolicy(securityRes || defaultSecurityPolicy);
      setRetention(retentionRes || { retentionDays: 365, complianceSettings: {} });
      setAuditLogs(auditRes?.items || []);
      setLegalHolds(holdsRes || []);
    } catch (error) {
      setMessage(`Failed to load admin data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const saveSecurityPolicy = async () => {
    try {
      await ApiService.updateSecurityPolicies(securityPolicy);
      setMessage('Security policies updated.');
      loadAll();
    } catch (error) {
      setMessage(`Failed to update security policies: ${error.message}`);
    }
  };

  const saveRetention = async () => {
    try {
      await ApiService.updateRetentionPolicy({ retentionDays: Number(retention.retentionDays), complianceSettings: retention.complianceSettings || {} });
      setMessage('Retention policy updated.');
      loadAll();
    } catch (error) {
      setMessage(`Failed to update retention policy: ${error.message}`);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await ApiService.updateAdminUser(userId, { status });
      setMessage('User status updated.');
      loadAll();
    } catch (error) {
      setMessage(`Failed to update user status: ${error.message}`);
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await ApiService.updateAdminUserRoles(userId, { roles: [role] });
      setMessage('User role updated.');
      loadAll();
    } catch (error) {
      setMessage(`Failed to update user role: ${error.message}`);
    }
  };



  const runRetentionJob = async () => {
    try {
      const result = await ApiService.runRetentionJob();
      setMessage(`Retention job completed. Deleted ${result.deletedMessages} messages.`);
      loadAll();
    } catch (error) {
      setMessage(`Failed to run retention job: ${error.message}`);
    }
  };

  const createLegalHold = async () => {
    try {
      await ApiService.createLegalHold(holdForm);
      setMessage('Legal hold created.');
      setHoldForm({ scopeType: 'conversation', scopeId: '', reason: '' });
      loadAll();
    } catch (error) {
      setMessage(`Failed to create legal hold: ${error.message}`);
    }
  };

  const releaseLegalHold = async (holdId) => {
    try {
      await ApiService.releaseLegalHold(holdId);
      setMessage('Legal hold released.');
      loadAll();
    } catch (error) {
      setMessage(`Failed to release legal hold: ${error.message}`);
    }
  };

  const runEdiscoveryExport = async () => {
    try {
      const payload = await ApiService.createEdiscoveryExport({ includeFiles: true });
      setExportResult(payload);
      setMessage('eDiscovery export generated.');
      loadAll();
    } catch (error) {
      setMessage(`Failed to generate eDiscovery export: ${error.message}`);
    }
  };

  if (loading) return <div className="admin-page">Loading admin console...</div>;

  return (
    <div className="admin-page">
      <h1>Admin Console</h1>
      {message && <p className="admin-message">{message}</p>}

      <section className="admin-card">
        <h2>User & Role Management</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const currentRole = user.orgMemberships?.[0]?.role || 'MEMBER';
              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.status}</td>
                  <td>
                    <select value={currentRole} onChange={(e) => updateUserRole(user.id, e.target.value)}>
                      {Object.keys(rolesMatrix).map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active')}>
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>Org Security Policies</h2>
        <label>
          <input type="checkbox" checked={securityPolicy.mfaRequired} onChange={(e) => setSecurityPolicy({ ...securityPolicy, mfaRequired: e.target.checked })} />
          Require MFA
        </label>
        <label>
          <input type="checkbox" checked={securityPolicy.ssoRequired} onChange={(e) => setSecurityPolicy({ ...securityPolicy, ssoRequired: e.target.checked })} />
          Require SSO
        </label>
        <label>
          Allowed Auth Methods (comma-separated)
          <input
            type="text"
            value={(securityPolicy.allowedAuthMethods || []).join(',')}
            onChange={(e) => setSecurityPolicy({ ...securityPolicy, allowedAuthMethods: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })}
          />
        </label>
        <button onClick={saveSecurityPolicy}>Save Security Policies</button>
      </section>

      <section className="admin-card">
        <h2>Retention Policy</h2>
        <label>
          Retention Days
          <input type="number" min="1" value={retention.retentionDays} onChange={(e) => setRetention({ ...retention, retentionDays: e.target.value })} />
        </label>
        <button onClick={saveRetention}>Save Retention Policy</button>
      </section>



      <section className="admin-card">
        <h2>Retention Jobs</h2>
        <button onClick={runRetentionJob}>Run Retention Job Now</button>
      </section>

      <section className="admin-card">
        <h2>Legal Holds</h2>
        <div className="hold-form">
          <select value={holdForm.scopeType} onChange={(e) => setHoldForm({ ...holdForm, scopeType: e.target.value })}>
            <option value="conversation">Conversation</option>
            <option value="user">User</option>
          </select>
          <input placeholder="Scope ID (cuid)" value={holdForm.scopeId} onChange={(e) => setHoldForm({ ...holdForm, scopeId: e.target.value })} />
          <input placeholder="Reason" value={holdForm.reason} onChange={(e) => setHoldForm({ ...holdForm, reason: e.target.value })} />
          <button onClick={createLegalHold}>Create Hold</button>
        </div>
        <div className="audit-list">
          {legalHolds.map((hold) => (
            <div className="audit-item" key={hold.id}>
              <strong>{hold.scopeType} / {hold.scopeId}</strong>
              <small>{hold.reason}</small>
              <small>Status: {hold.active ? 'active' : 'released'}</small>
              {hold.active && <button onClick={() => releaseLegalHold(hold.id)}>Release Hold</button>}
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h2>eDiscovery Export</h2>
        <button onClick={runEdiscoveryExport}>Generate Scoped Export</button>
        {exportResult && (
          <pre className="admin-json">{JSON.stringify({
            generatedAt: exportResult.generatedAt,
            includeContent: exportResult.includeContent,
            counts: exportResult.counts
          }, null, 2)}</pre>
        )}
      </section>

      <section className="admin-card">
        <h2>Audit Logs</h2>
        <div className="audit-list">
          {auditLogs.map((entry) => (
            <div className="audit-item" key={entry.id}>
              <strong>{entry.action}</strong>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
              <small>{entry.targetType} {entry.targetId || ''}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
