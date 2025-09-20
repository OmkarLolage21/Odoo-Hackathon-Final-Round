import { useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface SalesOrderRow { id: string; number: string; customer: string; date: string; total: number; status: 'draft' | 'confirmed' | 'invoiced'; }
const mock: SalesOrderRow[] = [
  { id: '1', number: 'SO/2025/0001', customer: 'Nimesh Pathak', date: '2025-09-16', total: 23610, status: 'invoiced' }
];

export default function SalesOrderList() {
  const [rows] = useState(mock);
  const columns = [
    { key: 'number', label: 'SO No' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Order Date' },
    { key: 'total', label: 'Total', render: (v: number) => `₹${v.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-100 text-brand-700 capitalize">{v}</span> },
    { key: 'actions', label: 'Actions', render: (_: any, r: SalesOrderRow) => <Link to={`/sales-orders/${r.id}/edit`} className="text-brand-600 hover:text-brand-500 text-sm">Open</Link> }
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <Link to="/sales-orders/new"><Button size="sm"><PlusIcon className="w-5 h-5 mr-2" />New</Button></Link>
      </div>
      <Card><Table columns={columns} data={rows} /></Card>
    </div>
  );
}
