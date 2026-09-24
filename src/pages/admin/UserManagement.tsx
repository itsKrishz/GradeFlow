import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, UserPlus, Shield, GraduationCap, CheckCircle2, XCircle, MoreVertical, Key, User as UserIcon, Mail, Edit3, Trash2, X } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { api } from '../../services/api';

export interface ManagedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'teacher' | 'student';
  status: 'Active' | 'Inactive';
  department: string;
}

const BLACKLISTED_USERNAMES = new Set([
  'teacher',
  'robert.c',
  'elena.r',
  'student',
  'anjali.m',
  'student2',
  'priya.s',
  'vikram.a',
]);

const BLACKLISTED_EMAILS = new Set([
  'teacher@gradeflow.edu',
  'robert.c@gradeflow.edu',
  'elena.r@gradeflow.edu',
  'rahul.k@student.edu',
  'student@gradeflow.edu',
  'anjali.m@student.edu',
  'student2@gradeflow.edu',
  'arjun.n@student.edu',
  'priya.s@student.edu',
  'vikram.a@student.edu',
]);

const defaultCleanUsers: ManagedUser[] = [
  { id: 'u-bhadra', name: 'Bhadra K.', username: 'bhadra', email: 'bhadra.k@student.edu', role: 'student', status: 'Active', department: 'Computer Science & Engineering' },
  { id: 'u-nevin', name: 'Nevin P.', username: 'nevin', email: 'nevin.p@student.edu', role: 'student', status: 'Active', department: 'Computer Science & Engineering' },
  { id: 'u-teacher1', name: 'Prof. Teacher', username: 'teacher1', email: 'teacher1@gradeflow.edu', role: 'teacher', status: 'Active', department: 'Computer Science & Engineering' },
];

export const UserManagement: React.FC = () => {
  const { showToast, registerUser } = useApp();

  const [users, setUsers] = useState<ManagedUser[]>(() => {
    // 1. Sanitize local storage of any blacklisted accounts
    let managed: ManagedUser[] = [];
    try {
      const saved = localStorage.getItem('gradeflow_managed_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          managed = parsed.filter((u: any) =>
            u.username &&
            !BLACKLISTED_USERNAMES.has(u.username.toLowerCase()) &&
            !BLACKLISTED_EMAILS.has(u.email?.toLowerCase())
          );
        }
      }
    } catch (e) {
      // ignore
    }

    // Also sanitize credentials cache
    try {
      const savedCreds = localStorage.getItem('gradeflow_user_credentials');
      if (savedCreds) {
        const creds = JSON.parse(savedCreds);
        let modified = false;
        for (const un of BLACKLISTED_USERNAMES) {
          if (creds[un]) { delete creds[un]; modified = true; }
        }
        for (const em of BLACKLISTED_EMAILS) {
          if (creds[em]) { delete creds[em]; modified = true; }
        }
        if (modified) {
          localStorage.setItem('gradeflow_user_credentials', JSON.stringify(creds));
        }
      }
    } catch (e) {
      // ignore
    }

    // Merge clean defaults if not present
    const existingUsernames = new Set(managed.map(u => u.username.toLowerCase()));
    const finalUsers = [...managed];
    for (const d of defaultCleanUsers) {
      if (!existingUsernames.has(d.username.toLowerCase())) {
        finalUsers.push(d);
        existingUsernames.add(d.username.toLowerCase());
      }
    }

    localStorage.setItem('gradeflow_managed_users', JSON.stringify(finalUsers));
    return finalUsers;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<(ManagedUser & { password?: string }) | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'teacher' as 'teacher' | 'student',
    department: 'Computer Science & Engineering'
  });

  const toggleUserStatus = (id: string) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
          showToast(`User ${u.name} set to ${nextStatus}`, 'info');
          return { ...u, status: nextStatus as 'Active' | 'Inactive' };
        }
        return u;
      });
      localStorage.setItem('gradeflow_managed_users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const cleanUsername = newUser.username.trim().toLowerCase();
    const cleanEmail = newUser.email.trim().toLowerCase();

    if (users.some(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)) {
      showToast(`User with username '${cleanUsername}' or email already exists`, 'error');
      return;
    }

    await registerUser({
      name: newUser.name,
      username: cleanUsername,
      email: cleanEmail,
      password: newUser.password,
      role: newUser.role,
      department: newUser.department,
    });

    const created: ManagedUser = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      username: cleanUsername,
      email: cleanEmail,
      role: newUser.role,
      status: 'Active',
      department: newUser.department
    };

    const nextUsers = [created, ...users];
    setUsers(nextUsers);
    localStorage.setItem('gradeflow_managed_users', JSON.stringify(nextUsers));
    setShowAddModal(false);
    setNewUser({ name: '', username: '', email: '', password: '', role: 'teacher', department: 'Computer Science & Engineering' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editingUser.name.trim() || !editingUser.username.trim() || !editingUser.email.trim()) {
      showToast('Name, username, and email are required', 'error');
      return;
    }

    const cleanUsername = editingUser.username.trim().toLowerCase();
    const cleanEmail = editingUser.email.trim().toLowerCase();

    // Check collision with other users
    const collision = users.find(u => 
      u.id !== editingUser.id && (u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)
    );
    if (collision) {
      showToast(`Username '@${cleanUsername}' or email is already taken by another account`, 'error');
      return;
    }

    // Find previous record to handle credential key renames if username/email changed
    const prevUser = users.find(u => u.id === editingUser.id);
    const prevUsername = prevUser?.username.toLowerCase();
    const prevEmail = prevUser?.email.toLowerCase();

    const updatedUser: ManagedUser = {
      id: editingUser.id,
      name: editingUser.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role: editingUser.role,
      status: editingUser.status,
      department: editingUser.department.trim() || 'Computer Science & Engineering'
    };

    // 1. Update state & managed users in localStorage
    const nextUsers = users.map(u => u.id === editingUser.id ? updatedUser : u);
    setUsers(nextUsers);
    localStorage.setItem('gradeflow_managed_users', JSON.stringify(nextUsers));

    // 2. Update credentials in localStorage
    try {
      const savedCreds = localStorage.getItem('gradeflow_user_credentials');
      const creds = savedCreds ? JSON.parse(savedCreds) : {};

      // Determine password: new password if entered, or existing password, or fallback
      let currentPassword = editingUser.password?.trim();
      if (!currentPassword) {
        if (prevUsername && creds[prevUsername]?.pwd) {
          currentPassword = creds[prevUsername].pwd;
        } else if (prevEmail && creds[prevEmail]?.pwd) {
          currentPassword = creds[prevEmail].pwd;
        } else {
          currentPassword = editingUser.role === 'teacher' ? 'teacher123' : 'student123';
        }
      }

      // If username or email changed, delete old keys
      if (prevUsername && prevUsername !== cleanUsername) {
        delete creds[prevUsername];
      }
      if (prevEmail && prevEmail !== cleanEmail) {
        delete creds[prevEmail];
      }

      const credEntry = {
        role: editingUser.role,
        pwd: currentPassword,
        userId: editingUser.id,
        name: editingUser.name.trim(),
        department: updatedUser.department,
        email: cleanEmail
      };

      creds[cleanUsername] = credEntry;
      creds[cleanEmail] = credEntry;

      localStorage.setItem('gradeflow_user_credentials', JSON.stringify(creds));
    } catch (err) {
      console.warn('Error updating credentials cache:', err);
    }

    // 3. Update current active user session if editing logged-in user
    try {
      const currentRaw = localStorage.getItem('gradeflow_current_user');
      if (currentRaw) {
        const current = JSON.parse(currentRaw);
        if (current.id === editingUser.id || current.username?.toLowerCase() === prevUsername) {
          const updatedCurrent = {
            ...current,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department
          };
          localStorage.setItem('gradeflow_current_user', JSON.stringify(updatedCurrent));
          localStorage.setItem('gradeflow_current_role', updatedUser.role);
        }
      }
    } catch (err) {
      console.warn('Error updating session user:', err);
    }

    // 4. Update backend if available
    try {
      await api.auth.updateUser(editingUser.id, {
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        password: editingUser.password?.trim() || undefined
      });
    } catch (err: any) {
      console.warn('[Backend updateUser Warning]:', err.message);
    }

    showToast(`User '${updatedUser.name}' updated successfully!`, 'success');
    setEditingUser(null);
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${user.name}' (@${user.username})?`)) {
      return;
    }

    const nextUsers = users.filter(u => u.id !== user.id);
    setUsers(nextUsers);
    localStorage.setItem('gradeflow_managed_users', JSON.stringify(nextUsers));

    // Remove from credentials
    try {
      const savedCreds = localStorage.getItem('gradeflow_user_credentials');
      if (savedCreds) {
        const creds = JSON.parse(savedCreds);
        delete creds[user.username.toLowerCase()];
        delete creds[user.email.toLowerCase()];
        localStorage.setItem('gradeflow_user_credentials', JSON.stringify(creds));
      }
    } catch (err) {
      console.warn('Error cleaning deleted user credentials:', err);
    }

    // Call backend
    try {
      await api.auth.deleteUser(user.id);
    } catch (err: any) {
      console.warn('[Backend deleteUser Warning]:', err.message);
    }

    showToast(`User '${user.name}' deleted successfully.`, 'info');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-academic-lightBorder dark:border-academic-darkBorder">
        <div>
          <h2 className="text-xl font-bold text-academic-lightText dark:text-academic-darkText tracking-tight">
            User Management & Authorization
          </h2>
          <p className="text-xs text-academic-lightMuted dark:text-academic-darkMuted mt-0.5">
            Admin portal for creating and provisioning faculty (teacher) and student credentials.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, @username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-600 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Filter Role:</span>
          {(['all', 'teacher', 'student'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 text-xs rounded-md capitalize font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {role === 'all' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Academic User</th>
                <th className="px-4 py-3">Login Username</th>
                <th className="px-4 py-3">Institutional Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300">
                      {user.name.charAt(0)}
                    </div>
                    <span>{user.name}</span>
                  </td>

                  <td className="px-4 py-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                    @{user.username}
                  </td>

                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                      user.role === 'teacher'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {user.department}
                  </td>

                  <td className="px-4 py-3">
                    {user.status === 'Active' ? (
                      <Badge variant="green" size="sm">Active</Badge>
                    ) : (
                      <Badge variant="rose" size="sm">Inactive</Badge>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingUser({
                          ...user,
                          password: ''
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                        title="Edit user credentials and details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                          user.status === 'Active'
                            ? 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                            : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded border border-rose-200 dark:border-rose-800 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Provision New Academic Account
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Admin creation of Teacher or Student login credentials.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Alan Turing or Emily Watson"
                  value={newUser.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const suggestedUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setNewUser(prev => ({
                      ...prev,
                      name,
                      username: prev.username ? prev.username : suggestedUsername
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Login Username *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-zinc-400 pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full pl-6 pr-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. pass123"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gradeflow.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Account Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'teacher' | 'student' })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="teacher">Teacher (Faculty Evaluator)</option>
                    <option value="student">Student (Learner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] text-zinc-500">
                <span>When created, this user can immediately sign in at <code>/login</code> with username <strong>@{newUser.username || 'username'}</strong> and the password provided.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white dark:text-zinc-900 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-md shadow-sm transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Edit Academic Account</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Update credentials, name, role, and department for @{editingUser.username}.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Login Username *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-zinc-400 pointer-events-none">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                      className="w-full pl-6 pr-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Update Password
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Account Role *
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'teacher' | 'student' })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="teacher">Teacher (Faculty Evaluator)</option>
                    <option value="student">Student (Learner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Status *
                  </label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[11px] text-zinc-500">
                <span>Updated credentials take effect immediately for login at <code>/login</code> and permissions.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
