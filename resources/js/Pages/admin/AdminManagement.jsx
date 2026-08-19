import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { UserPlus, Mail, Shield, User as UserIcon, Trash2, Check } from 'lucide-react';

export default function AdminManagement() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">Only Super Admins can manage administrator accounts.</p>
      </div>
    );
  }

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteSuccess(true);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(false), 3000);
      queryClient.invalidateQueries(['users']);
    } catch (err) {
      alert('Invite failed: ' + (err.message || 'Unknown error'));
    }
    setInviting(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await base44.entities.User.update(userId, { role: newRole });
      queryClient.invalidateQueries(['users']);
    } catch (err) {
      alert('Failed to update role: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">Admin Management</h1>

      {/* Invite */}
      <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-8">
        <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" /> Invite New Admin
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            placeholder="email@example.com"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
          >
            <option value="user">Staff (Admin)</option>
            <option value="admin">Super Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-label hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {inviting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
            ) : inviteSuccess ? (
              <><Check className="w-4 h-4" /> Invited!</>
            ) : (
              <><Mail className="w-4 h-4" /> Send Invite</>
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          An invitation email will be sent. The invitee must create an account to access the dashboard.
        </p>
      </div>

      {/* Admin List */}
      <div className="bg-card rounded-2xl shadow-warm-sm p-6">
        <h2 className="font-heading text-xl font-bold mb-4">Team Members</h2>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No team members found.</p>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    u.role === 'admin' ? 'bg-primary/10' : 'bg-secondary'
                  }`}>
                    {u.role === 'admin' ? (
                      <Shield className="w-5 h-5 text-primary" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-sm truncate">{u.full_name || u.email}</p>
                    {u.full_name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.id === currentUser?.id ? (
                    <span className="px-3 py-1.5 rounded-full font-label text-xs bg-primary text-primary-foreground">
                      You
                    </span>
                  ) : (
                    <select
                      value={u.role || 'user'}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="px-3 py-1.5 bg-background border border-border rounded-lg font-label text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="user">Staff</option>
                      <option value="admin">Super Admin</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-lg font-bold">Super Admin</h3>
          </div>
          <p className="text-sm text-muted-foreground">Full system access. Can manage administrator accounts, settings, and all system functions.</p>
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-heading text-lg font-bold">Staff</h3>
          </div>
          <p className="text-sm text-muted-foreground">Can manage products, orders, homepage content, and customers. Cannot manage administrator accounts.</p>
        </div>
      </div>
    </div>
  );
}