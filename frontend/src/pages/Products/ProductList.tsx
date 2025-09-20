import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Table from '../../components/UI/Table';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { canCreateMasterData, canEditMasterData, canDeleteMasterData } from '../../utils/rolePermissions';

// Mock data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Executive Office Chair',
    type: 'goods',
    salesPrice: 25000,
    purchasePrice: 18000,
    saleTaxPercent: 18,
    purchaseTaxPercent: 18,
    hsnCode: '9401',
    category: 'Furniture',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    id: '2',
    name: 'Wooden Conference Table',
    type: 'goods',
    salesPrice: 45000,
    purchasePrice: 32000,
    saleTaxPercent: 18,
    purchaseTaxPercent: 18,
    hsnCode: '9403',
    category: 'Furniture',
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02')
  },
  {
    id: '3',
    name: 'Installation Service',
    type: 'service',
    salesPrice: 5000,
    purchasePrice: 3500,
    saleTaxPercent: 18,
    purchaseTaxPercent: 18,
    hsnCode: '9954',
    category: 'Services',
    createdAt: new Date('2025-01-03'),
    updatedAt: new Date('2025-01-03')
  },
];

export default function ProductList() {
  const { user } = useAuth();
  const [products] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.hsnCode.includes(searchTerm);
    const matchesType = !filterType || product.type === filterType;
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const columns = useMemo(() => [
    { key: 'name', label: 'Product Name', sortable: true },
    { 
      key: 'type', 
      label: 'Type', 
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          value === 'goods' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'category', label: 'Category' },
    { 
      key: 'salesPrice', 
      label: 'Sales Price',
      render: (value: number) => `₹${value.toLocaleString()}`
    },
    { 
      key: 'purchasePrice', 
      label: 'Purchase Price',
      render: (value: number) => `₹${value.toLocaleString()}`
    },
    { key: 'hsnCode', label: 'HSN Code' },
    { 
      key: 'saleTaxPercent', 
      label: 'Tax %',
      render: (value: number) => `${value}%`
    },
    (canEditMasterData(user?.role) || canDeleteMasterData(user?.role)) ? {
      key: 'actions',
      label: 'Actions',
      render: (_: any, product: Product) => (
        <div className="flex space-x-2">
          {canEditMasterData(user?.role) && (
            <Link
              to={`/products/${product.id}/edit`}
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your products and services</p>
        </div>
        {canCreateMasterData(user?.role) && (
          <Link to="/products/new">
            <Button>
              <PlusIcon className="w-5 h-5 mr-2" />
              New
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            aria-label="Filter product type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Types</option>
            <option value="goods">Goods</option>
            <option value="service">Service</option>
          </select>

          <select
            aria-label="Filter product category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Total: {filteredProducts.length}</span>
            <span>•</span>
            <span>Goods: {filteredProducts.filter(p => p.type === 'goods').length}</span>
            <span>•</span>
            <span>Services: {filteredProducts.filter(p => p.type === 'service').length}</span>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Products', 
            value: products.length, 
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
          },
          { 
            label: 'Avg. Sales Price', 
            value: `₹${Math.round(products.reduce((sum, p) => sum + p.salesPrice, 0) / products.length).toLocaleString()}`,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          },
          { 
            label: 'Avg. Margin', 
            value: `${Math.round(products.reduce((sum, p) => sum + ((p.salesPrice - p.purchasePrice) / p.salesPrice * 100), 0) / products.length)}%`,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
          },
          { 
            label: 'Categories', 
            value: categories.length,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
              <div className={`w-6 h-6 ${stat.color}`}>📊</div>
            </div>
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns.filter(Boolean) as any}
        data={filteredProducts}
      />
    </div>
  );
}