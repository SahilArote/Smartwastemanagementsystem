import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  ShieldAlert, 
  Edit3, 
  Trash2, 
  X, 
  Building
} from 'lucide-react';
import type { UserProfile, UserAccount, Role } from '../types';
import { fetchUserAccounts, saveUserAccount, deleteUserAccount } from '../services/storage';

interface UsersManagementViewProps {
  currentUser: UserProfile;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  currentUser,
  showToast,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password_hash: 'Password@123',
    role: 'worker' as Role,
    phone: '',
    zone: 'Downtown Central',
    status: 'Active' as 'Active' | 'Suspended',
  });

  useEffect(() => {
    let isMounted = true;
    fetchUserAccounts().then((list) => {
      if (isMounted) {
        setUsers(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="tailux-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--accent-rose)' }} />
          <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--accent-rose)' }}>
            Restricted System Access
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto' }}>
            Staff directory management and Role-Based Access Control (RBAC) permissions are strictly restricted to Municipal System Administrators.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingUser(null);
    setForm({
      full_name: '',
      email: '',
      password_hash: 'Password@123',
      role: 'worker',
      phone: '',
      zone: 'Downtown Central',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      password_hash: user.password_hash || 'Password@123',
      role: user.role,
      phone: user.phone || '',
      zone: user.zone || 'Downtown Central',
      status: user.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    if (editingUser) {
      const updated: UserAccount = {
        ...editingUser,
        ...form,
      };
      const res = await saveUserAccount(updated);
      setUsers([...res]);
      showToast(`User account for "${updated.full_name}" updated`, 'success');
    } else {
      const newAcc: UserAccount = {
        id: 'usr-' + Date.now().toString(36),
        ...form,
        created_at: new Date().toISOString(),
      };
      const res = await saveUserAccount(newAcc);
      setUsers([...res]);
      showToast(`Staff member "${newAcc.full_name}" registered`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleToggleSuspend = async (user: UserAccount) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    const updated: UserAccount = { ...user, status: newStatus };
    const res = await saveUserAccount(updated);
    setUsers([...res]);
    showToast(`Account "${user.full_name}" set to ${newStatus}`, 'info');
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove user "${name}" from the municipal registry?`)) {
      const res = await deleteUserAccount(id);
      setUsers([...res]);
      showToast(`User "${name}" removed`, 'info');
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Staff & Access Permissions</h1>
          <p className="page-subtitle">
            Configure municipal personnel accounts, role-based privileges, and operational jurisdictions
          </p>
        </div>

        <div className="page-actions-group">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAdd}
          >
            <UserPlus size={14} />
            <span>Enroll Staff Member</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="tailux-card">
        <div className="table-responsive">
          <table className="tailux-table">
            <thead>
              <tr>
                <th>Personnel Details</th>
                <th>Assigned Role</th>
                <th>Division / Jurisdiction</th>
                <th>Contact Info</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                        {u.full_name ? u.full_name.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                          {u.full_name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${
                      u.role === 'admin' ? 'badge-rose' :
                      u.role === 'supervisor' ? 'badge-purple' :
                      'badge-blue'
                    }`} style={{ fontSize: '0.7rem' }}>
                      {u.role === 'admin' ? 'Administrator' : u.role === 'supervisor' ? 'Supervisor' : 'Collection Driver'}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                      <Building size={13} color="var(--primary)" />
                      <span>{u.zone || 'Headquarters'}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-body)' }}>
                      {u.phone || 'No direct phone'}
                    </div>
                  </td>

                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'badge-completed' : 'badge-pending'}`} style={{ fontSize: '0.68rem' }}>
                      {u.status}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleSuspend(u)}
                        title={u.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User"
                      >
                        <Edit3 size={13} />
                      </button>

                      {u.id !== currentUser.id && (
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => handleDelete(u.id, u.full_name)}
                          title="Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? 'Update Staff Member' : 'Enroll Staff Member'}</h3>
              <button 
                type="button" 
                className="btn btn-flat btn-icon-only"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Sarah Jenkins"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Official Email <span className="required">*</span></label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="s.jenkins@citywaste.gov"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">System Role <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  >
                    <option value="worker">Collection Worker / Driver</option>
                    <option value="supervisor">Operations Supervisor</option>
                    <option value="admin">Municipal Administrator</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Assigned Sector / Zone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Downtown Central"
                    value={form.zone}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Save Staff Changes' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
