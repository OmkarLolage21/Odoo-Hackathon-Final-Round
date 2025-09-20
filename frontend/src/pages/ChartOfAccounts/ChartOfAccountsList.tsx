import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartOfAccount } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData, canDeleteMasterData } from '../../utils/rolePermissions';

// Mock data
const mockAccounts: ChartOfAccount[] = [
  {
    id: '1',
    name: 'Bank A/c',
    type: 'asset',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    name: 'Purchase Expense A/c',
    type: 'expense',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '3',
    name: 'Debtors A/c',
    type: 'asset',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '4',
    name: 'Creditors A/c',
    type: 'liability',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '5',
    name: 'Sales Income A/c',
    type: 'income',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '6',
    name: 'Cash A/c',
    type: 'asset',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '7',
    name: 'Other Expense A/c',
    type: 'expense',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
];

export default function ChartOfAccountsList() {
  const { user } = useAuth();
  const [accounts] = useState<ChartOfAccount[]>(mockAccounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const columns = useMemo(() => [
    { key: 'name', label: 'Account Name', sortable: true },
    { 
      key: 'type', 
      label: 'Type',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          value === 'asset' ? 'bg-blue-100 text-blue-800' :
          value === 'liability' ? 'bg-red-100 text-red-800' :
          value === 'income' ? 'bg-green-100 text-green-800' :
          value === 'expense' ? 'bg-orange-100 text-orange-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    (canEditMasterData(user?.role) || canDeleteMasterData(user?.role)) ? {
      key: 'actions',
      label: 'Actions',
      render: (_: any, account: ChartOfAccount) => (
        <div className="flex space-x-2">
          {canEditMasterData(user?.role) && (
            <Link
              to={`/chart-of-accounts/${account.id}/edit`}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              Edit
            </Link>
          )}
          {canDeleteMasterData(user?.role) && (
            <button className="text-red-600 hover:text-red-900 text-sm font-medium">
              Delete
            </button>
          )}
        </div>
      )
    } : null
  ], [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-600">Manage your accounting structure</p>
        </div>
        {canCreateMasterData(user?.role) && (
          <Link to="/chart-of-accounts/new">
            <Button>
              <PlusIcon className="w-5 h-5 mr-2" />
              New
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
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            aria-label="Filter account type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Types</option>
            <option value="asset">Assets</option>
            <option value="liability">Liabilities</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="equity">Equity</option>
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Total: {filteredAccounts.length}</span>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { type: 'asset', label: 'Assets', count: accounts.filter(a => a.type === 'asset').length, color: 'bg-blue-100 text-blue-800' },
          { type: 'liability', label: 'Liabilities', count: accounts.filter(a => a.type === 'liability').length, color: 'bg-red-100 text-red-800' },
          { type: 'income', label: 'Income', count: accounts.filter(a => a.type === 'income').length, color: 'bg-green-100 text-green-800' },
          { type: 'expense', label: 'Expense', count: accounts.filter(a => a.type === 'expense').length, color: 'bg-orange-100 text-orange-800' },
          { type: 'equity', label: 'Equity', count: accounts.filter(a => a.type === 'equity').length, color: 'bg-purple-100 text-purple-800' },
        ].map((stat) => (
          <Card key={stat.type} padding={false}>
            <div className="p-4 text-center">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${stat.color} mb-2`}>
                {stat.label}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns.filter(Boolean) as any}
        data={filteredAccounts}
      />
    </div>
  );
}