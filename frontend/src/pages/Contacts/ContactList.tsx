import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Contact } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { visibleContactActions } from '../../utils/rolePermissions';

// Mock data
const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Azure Furniture',
    type: 'vendor',
    email: 'contact@azurefurniture.com',
    mobile: '+91 98765 43210',
    address: {
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    name: 'Nimesh Pathak',
    type: 'customer',
    email: 'nimesh@example.com',
    mobile: '+91 87654 32109',
    address: {
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02')
  },
  {
    id: '3',
    name: 'Modern Office Solutions',
    type: 'both',
    email: 'info@modernoffice.com',
    mobile: '+91 76543 21098',
    address: {
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03')
  },
];

export default function ContactList() {
  const { user } = useAuth();
  const [contacts] = useState<Contact[]>(mockContacts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  // Derive visible contacts based on role
  const roleFiltered = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'invoicing_user') return contacts; // full access
    if (user.role === 'contact') {
      // find matching contact by email or name for demo
      return contacts.filter(c => c.email === user.email || c.name === user.name);
    }
    return [];
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
        render: (_: any, contact: Contact) => (
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
              <button className="text-red-600 hover:text-red-900 text-sm font-medium">
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

      {/* Table */}
      <Table columns={columns.filter(Boolean) as any} data={filteredContacts} />
    </div>
  );
}