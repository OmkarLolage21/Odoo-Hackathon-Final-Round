import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import customerInvoiceService from '../../services/customerInvoiceService';
import { useAuth } from '../../contexts/AuthContext';
import { CustomerInvoiceResponse } from '../../types';

export default function CustomerInvoiceList() {
  const { user } = useAuth();
  const role = user?.role;
  const [rows, setRows] = useState<CustomerInvoiceResponse[]>([]);

  useEffect(() => {
    (async () => {
      const data = await customerInvoiceService.list(role);
      setRows(data);
    })();
  }, [role]);

  const columns = useMemo(() => [
    { key: 'invoice_number', label: 'Invoice' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'invoice_date', label: 'Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Amount', render: (v: number) => `₹${(v || 0).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => <span className="text-xs font-semibold px-2 py-1 rounded-full bg-brand-100 text-brand-700 capitalize">{v}</span> },
    { key: 'actions', label: 'Actions', render: (_: any, r: CustomerInvoiceResponse) => <Link to={`/customer-invoices/${r.id}/edit`} className="text-brand-600 hover:text-brand-500 text-sm">Open</Link> }
  ], []);

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
