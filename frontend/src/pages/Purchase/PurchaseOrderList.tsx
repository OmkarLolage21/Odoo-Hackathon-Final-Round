import { useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface PurchaseOrderRow {
  id: string;
  number: string;
  vendor: string;
  date: string;
  total: number;
  status: 'draft' | 'confirmed' | 'billed';
}

const mockData: PurchaseOrderRow[] = [
  { id: '1', number: 'PO/2025/0001', vendor: 'Azure Interior', date: '2025-09-15', total: 15350, status: 'draft' },
  { id: '2', number: 'PO/2025/0002', vendor: 'Modern Office', date: '2025-09-16', total: 9820, status: 'confirmed' },
];

export default function PurchaseOrderList() {
  const [rows] = useState(mockData);

  const columns = [
    { key: 'number', label: 'PO No', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true },
    { key: 'date', label: 'PO Date' },
    { key: 'total', label: 'Total', render: (v: number) => `₹${v.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
        v === 'draft' ? 'bg-gray-100 text-gray-700' : v === 'confirmed' ? 'bg-brand-100 text-brand-700' : 'bg-green-100 text-green-700'
      }`}>{v}</span>
    )},
    { key: 'actions', label: 'Actions', render: (_: any, r: PurchaseOrderRow) => (
      <Link to={`/purchase-orders/${r.id}/edit`} className="text-brand-600 hover:text-brand-500 text-sm font-medium">Open</Link>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Link to="/purchase-orders/new">
          <Button size="sm"><PlusIcon className="w-5 h-5 mr-2" />New</Button>
        </Link>
      </div>
      <Card>
        <Table columns={columns} data={rows} />
      </Card>
    </div>
  );
}
