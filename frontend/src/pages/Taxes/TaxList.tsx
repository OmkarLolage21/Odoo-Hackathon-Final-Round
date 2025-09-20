import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tax } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData, canDeleteMasterData } from '../../utils/rolePermissions';

// Mock data
const mockTaxes: Tax[] = [
  {
    id: '1',
    name: 'GST 5%',
    computationMethod: 'percentage',
    rate: 5,
    applicableOn: 'both',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    name: 'GST 18%',
    computationMethod: 'percentage',
    rate: 18,
    applicableOn: 'both',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '3',
    name: 'Service Charge',
    computationMethod: 'fixed',
    rate: 100,
    applicableOn: 'sales',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
];

export default function TaxList() {
  const { user } = useAuth();
  const [taxes] = useState<Tax[]>(mockTaxes);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('');

  const filteredTaxes = taxes.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = !filterMethod || tax.computationMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const columns = useMemo(() => [
    { key: 'name', label: 'Tax Name', sortable: true },
    { 
      key: 'computationMethod', 
      label: 'Computation Method',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          value === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'rate', 
      label: 'Rate',
      render: (value: number, tax: Tax) => 
        tax.computationMethod === 'percentage' ? `${value}%` : `₹${value}`
    },
    { 
      key: 'applicableOn', 
      label: 'Applicable On',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          value === 'sales' ? 'bg-green-100 text-green-800' :
          value === 'purchase' ? 'bg-orange-100 text-orange-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value}
        </span>
      )
    },
    (canEditMasterData(user?.role) || canDeleteMasterData(user?.role)) ? {
      key: 'actions',
      label: 'Actions',
      render: (_: any, tax: Tax) => (
        <div className="flex space-x-2">
          {canEditMasterData(user?.role) && (
            <Link
              to={`/taxes/${tax.id}/edit`}
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
          <h1 className="text-2xl font-bold text-gray-900">Taxes</h1>
          <p className="text-gray-600">Manage tax rates and computation methods</p>
        </div>
        {canCreateMasterData(user?.role) && (
          <Link to="/taxes/new">
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
              placeholder="Search taxes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            aria-label="Filter computation method"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Methods</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Value</option>
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Total: {filteredTaxes.length}</span>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Table
        columns={columns.filter(Boolean) as any}
        data={filteredTaxes}
      />
    </div>
  );
}