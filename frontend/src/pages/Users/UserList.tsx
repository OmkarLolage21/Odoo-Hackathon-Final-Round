import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import { PlusIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { visibleUserActions } from '../../utils/rolePermissions';
import { userService } from '../../services/userService';

export default function UserList() {
  const { user } = useAuth();
  const role = user?.role;
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (!role) return; // no auth yet
    let active = true;
    setLoading(true);
    if (isAdmin) {
      userService.list(role)
        .then(data => { if (active) setUsers(data); })
        .catch(e => { if (active) setError(e.message); })
        .finally(() => active && setLoading(false));
    } else if (user) {
      // Non-admin: just show self
      setUsers([user as User]);
      setLoading(false);
    }
    return () => { active = false; };
  }, [role, isAdmin, user]);

  const roleFiltered = useMemo(() => users, [users]);

  const filteredUsers = roleFiltered.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const perms = visibleUserActions(user?.role);
  const columns = [
    { 
      key: 'profileImage', 
      label: 'Image',
      render: () => (
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <UserCircleIcon className="w-8 h-8 text-gray-400" />
        </div>
      )
    },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Role', 
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'invoicing_user' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    perms.edit || perms.delete ? {
      key: 'actions',
      label: 'Actions',
      render: (_: any, u: User) => (
        <div className="flex space-x-2">
          {perms.edit && (
            <Link
              to={`/users/${u.id}/edit`}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              Edit
            </Link>
          )}
          {perms.delete && (
            <button className="text-red-600 hover:text-red-900 text-sm font-medium">
              Delete
            </button>
          )}
        </div>
      )
    } : null
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        {(user?.role === 'admin') && (
          <Link to="/users/new">
            <Button>
              <PlusIcon className="w-5 h-5 mr-2" />
              Create User
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {(user?.role === 'admin') && (
            <select
              aria-label="Filter by role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="invoicing_user">Invoicing User</option>
              <option value="contact">Contact</option>
            </select>
          )}

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Total: {filteredUsers.length}</span>
          </div>
        </div>
      </Card>

      {/* Table */}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Table isLoading={loading} columns={columns.filter(Boolean) as any} data={filteredUsers} />
    </div>
  );
}