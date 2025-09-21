import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import {
  CubeIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../utils/apiClient';

type DashboardMonthlyItem = {
  month: string; // YYYY-MM
  sales: number;
  purchases: number;
};

type DashboardResponse = {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  total_items_in_stock: number;
  sales_vs_purchases: DashboardMonthlyItem[];
};

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const labelMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString('en-US', { month: 'short' });
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role === 'contact') return; // contact view handled below
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers: Record<string, string> = {};
        if (user.role) headers['X-User-Role'] = user.role; // admin | invoicing_user
        const res = await apiClient.get<DashboardResponse>('/api/v1/dashboard', { headers });
        setData(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user]);

  const chartData = useMemo(() => {
    if (!data) return [] as { month: string; sales: number; purchases: number }[];
    return data.sales_vs_purchases.map((i) => ({
      month: labelMonth(i.month),
      sales: i.sales,
      purchases: i.purchases,
    }));
  }, [data]);

  if (user?.role === 'contact') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Manage your invoices and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Outstanding Invoices', value: '₹45,200', color: 'text-red-600' },
            { name: 'Paid This Month', value: '₹78,500', color: 'text-green-600' },
            { name: 'Total Invoices', value: '156', color: 'text-blue-600' },
            { name: 'Overdue', value: '3', color: 'text-orange-600' },
          ].map((stat) => (
            <Card key={stat.name}>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            {[
              { id: 'INV-001', date: '2025-01-15', amount: '₹15,200', status: 'Paid' },
              { id: 'INV-002', date: '2025-01-10', amount: '₹8,750', status: 'Outstanding' },
              { id: 'INV-003', date: '2025-01-05', amount: '₹22,400', status: 'Overdue' },
            ].map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.id}</p>
                  <p className="text-sm text-gray-600">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{invoice.amount}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'Outstanding' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your business performance</p>
      </div>

      {loading && (
        <Card>
          <p className="text-gray-600">Loading dashboard...</p>
        </Card>
      )}
      {error && (
        <Card>
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Key Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <BanknotesIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.total_revenue)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <DocumentTextIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.total_expenses)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${data.net_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {data.net_profit >= 0 ? (
                  <ArrowUpIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <ArrowDownIcon className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${data.net_profit >= 0 ? 'text-gray-900' : 'text-red-700'}`}>{formatCurrency(data.net_profit)}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <CubeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Items in Stock</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_items_in_stock}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sales vs Purchases Chart */}
      {data && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sales vs Purchases</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                <Bar dataKey="sales" fill="#8B5CF6" name="Sales" />
                <Bar dataKey="purchases" fill="#3B82F6" name="Purchases" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
      {/* End */}
    </div>
  );
}