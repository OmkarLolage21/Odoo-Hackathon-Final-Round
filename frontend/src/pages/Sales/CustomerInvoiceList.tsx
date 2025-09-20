import { useState } from 'react';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface InvoiceRow { id: string; number: string; customer: string; date: string; due: string; amount: number; status: 'draft' | 'posted' | 'paid'; }
const mock: InvoiceRow[] = [
  { id: '1', number: 'INV/2025/0001', customer: 'Nimesh Pathak', date: '2025-09-16', due: '2025-09-30', amount: 23610, status: 'posted' }
];

export default function CustomerInvoiceList() {
  const [rows] = useState(mock);
  const columns = [
    { key: 'number', label: 'Invoice' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'due', label: 'Due Date' },
    { key: 'amount', label: 'Amount', render: (v: number) => `₹${v.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-100 text-brand-700 capitalize">{v}</span> },
    { key: 'actions', label: 'Actions', render: (_: any, r: InvoiceRow) => <Link to={`/customer-invoices/${r.id}/edit`} className="text-brand-600 hover:text-brand-500 text-sm">Open</Link> }
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customer Invoices</h1>
        <Link to="/customer-invoices/new"><Button size="sm"><PlusIcon className="w-5 h-5 mr-2" />New</Button></Link>
      </div>
      <Card><Table columns={columns} data={rows} /></Card>
    </div>
  );
}
