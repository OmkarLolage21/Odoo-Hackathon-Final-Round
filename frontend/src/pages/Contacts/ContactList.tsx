import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContactResponse } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { visibleContactActions } from '../../utils/rolePermissions';
import { contactService } from '../../services/contactService';

interface UiContact {
  id: string;
  name: string;
  type: 'customer' | 'vendor' | 'both';
  email: string;
  mobile: string;
  address: { city: string; state: string; pincode?: string };
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ContactList() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<UiContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await contactService.list();
        if (!active) return;
        // Transform backend shape to UI shape
        const mapped: UiContact[] = (data || []).map((c: ContactResponse) => ({
          id: c.id || crypto.randomUUID(),
          name: c.name || 'Unnamed',
          type: (c.type as any) || 'customer',
          email: c.email || '',
          mobile: c.mobile || '',
          address: {
            city: c.address_city || '',
            state: c.address_state || '',
            pincode: c.address_pincode || ''
          },
          createdAt: c.created_at ? new Date(c.created_at) : undefined,
          updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
        }));
        setContacts(mapped);
      } catch (e: any) {
        if (!active) return;
        if (e?.response?.status === 403) {
          setError('You do not have permission to view contacts.');
        } else {
          setError(e?.message || 'Failed to load contacts');
        }
      } finally {
        active = false;
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  // Derive visible contacts based on role
  const roleFiltered = useMemo(() => {
    if (!user) return [] as UiContact[];
    if (user.role === 'admin' || user.role === 'invoicing_user') return contacts;
    if (user.role === 'contact') {
      // contact user -> only their own contact: match by email first fallback to name
      return contacts.filter(c => c.email === user.email || c.name === user.name);
    }
    return [] as UiContact[];
  }, [user, contacts]);

  const filteredContacts = roleFiltered.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || contact.type === filterType || filterType === 'all';
    return matchesSearch && matchesType;
  });

  const contactPerms = visibleContactActions(user?.role);
  const columns = useMemo(() => {
    if (user?.role === 'contact') {
      // Restrict to only name column for contact users
      return [
        { key: 'name', label: 'Name', sortable: false }
      ];
    }
    return [
      { key: 'name', label: 'Name', sortable: true },
      {
        key: 'type',
        label: 'Type',
        render: (value: string) => (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
            value === 'customer' ? 'bg-green-100 text-green-800' :
            value === 'vendor' ? 'bg-blue-100 text-blue-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {value}
          </span>
        )
      },
      { key: 'email', label: 'Email' },
      { key: 'mobile', label: 'Mobile' },
      {
        key: 'address',
        label: 'Location',
        render: (address: any) => `${address.city}, ${address.state}`
      },
      (contactPerms.edit || contactPerms.delete) ? {
        key: 'actions',
        label: 'Actions',
        render: (_: any, contact: UiContact) => (
          <div className="flex space-x-2">
            {contactPerms.edit && (
              <Link
                to={`/contacts/${contact.id}/edit`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Edit
              </Link>
            )}
            {contactPerms.delete && (
              <button
                className="text-red-600 hover:text-red-900 text-sm font-medium"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!window.confirm('Delete this contact?')) return;
                  try {
                    await contactService.delete(contact.id);
                    setContacts(prev => prev.filter(c => c.id !== contact.id));
                  } catch (err: any) {
                    alert(err?.message || 'Failed to delete contact');
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        )
      } : null
    ];
  }, [user, contactPerms.delete, contactPerms.edit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage your customers and vendors</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'invoicing_user') && (
          <Link to="/contacts/new">
            <Button>
              <PlusIcon className="w-5 h-5 mr-2" />
              New
            </Button>
          </Link>
        )}
      </div>

      {/* Filters (hidden for contact role) */}
      {user?.role !== 'contact' && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              aria-label="Filter contact type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Types</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="both">Both</option>
            </select>
            {(user?.role === 'admin' || user?.role === 'invoicing_user') && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Total: {filteredContacts.length}</span>
                <span>•</span>
                <span>Customers: {filteredContacts.filter(c => c.type === 'customer' || c.type === 'both').length}</span>
                <span>•</span>
                <span>Vendors: {filteredContacts.filter(c => c.type === 'vendor' || c.type === 'both').length}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Table / States */}
      {loading && (
        <Card>
          <div className="py-10 text-center text-gray-500">Loading contacts...</div>
        </Card>
      )}
      {error && !loading && (
        <Card>
          <div className="py-6 text-center text-red-600 text-sm flex flex-col space-y-3">
            <span>{error}</span>
            <div>
              <Button variant="secondary" onClick={() => {
                // simple retry
                setError(null); setLoading(true);
                contactService.list().then(data => {
                  const mapped: UiContact[] = (data || []).map((c: ContactResponse) => ({
                    id: c.id || crypto.randomUUID(),
                    name: c.name || 'Unnamed',
                    type: (c.type as any) || 'customer',
                    email: c.email || '',
                    mobile: c.mobile || '',
                    address: { city: c.address_city || '', state: c.address_state || '', pincode: c.address_pincode || '' },
                    createdAt: c.created_at ? new Date(c.created_at) : undefined,
                    updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
                  }));
                  setContacts(mapped);
                  setLoading(false);
                }).catch(err => {
                  setError(err?.message || 'Failed to load contacts');
                  setLoading(false);
                });
              }}>Retry</Button>
            </div>
          </div>
        </Card>
      )}
      {!loading && !error && (
        <Table columns={columns.filter(Boolean) as any} data={filteredContacts} />
      )}
    </div>
  );
}