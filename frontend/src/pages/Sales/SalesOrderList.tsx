import { useEffect, useMemo, useState, useCallback } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import salesOrderService from '../../services/salesOrderService';
import { useAuth } from '../../contexts/AuthContext';

interface SalesOrderRow { id: string; so_number: string; created_at: string; total_amount: number; status: string; }

export default function SalesOrderList() {
  const { user } = useAuth();
  const role = user?.role;
  const [orders, setOrders] = useState<SalesOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const fetchOrders = useCallback(() => {
    if (!role) return;
    setLoading(true);
    salesOrderService.list(role)
      .then(data => setOrders(data as any))
      .catch(e => setError(e.message))
      .finally(()=> setLoading(false));
  }, [role]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDelete = async (id: string) => {
    if (!role) return;
    if (!confirm('Delete this Sales Order?')) return;
    try {
      await salesOrderService.delete(id, role);
      setOrders(o => o.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  };

  const rows = useMemo(() => orders.map(o => ({
    id: o.id,
    number: o.so_number,
    date: new Date(o.created_at).toLocaleDateString(),
    total: o.total_amount,
    status: o.status || 'draft'
  })), [orders]);

  const columns = [
    { key: 'number', label: 'SO No', sortable: true },
    { key: 'date', label: 'Order Date' },
    { key: 'total', label: 'Total', render: (v: number) => `₹${v?.toLocaleString?.() ?? v}` },
    { key: 'status', label: 'Status', render: (v: string) => {
      const cls = v === 'draft'
        ? 'bg-gray-100 text-gray-700'
        : v === 'confirmed'
          ? 'bg-indigo-100 text-indigo-700'
          : v === 'cancelled'
            ? 'bg-red-100 text-red-700'
            : 'bg-green-100 text-green-700';
      return <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${cls}`}>{v}</span>;
    }},
    { key: 'actions', label: 'Actions', render: (_: any, r: any) => (
      <div className="flex items-center space-x-3">
        <Link to={`/sales-orders/${r.id}/edit`} className="text-brand-600 hover:text-brand-500 text-sm font-medium">Edit</Link>
        {role === 'admin' && (
          <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-500 text-sm font-medium">Delete</button>
        )}
      </div>
    ) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <Link to="/sales-orders/new">
          <Button size="sm"><PlusIcon className="w-5 h-5 mr-2" />New</Button>
        </Link>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <Card>
        <Table columns={columns as any} data={rows} isLoading={loading} />
      </Card>
    </div>
  );
}
