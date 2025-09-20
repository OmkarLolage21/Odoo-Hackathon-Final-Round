import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/UI/Card';
import {
  UsersIcon,
  CubeIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const salesData = [
  { month: 'Jan', sales: 65000, purchases: 45000 },
  { month: 'Feb', sales: 78000, purchases: 52000 },
  { month: 'Mar', sales: 90000, purchases: 48000 },
  { month: 'Apr', sales: 81000, purchases: 61000 },
  { month: 'May', sales: 95000, purchases: 55000 },
  { month: 'Jun', sales: 87000, purchases: 49000 },
];

const expenseData = [
  { name: 'Purchases', value: 310000, color: '#8B5CF6' },
  { name: 'Operating Expenses', value: 85000, color: '#3B82F6' },
  { name: 'Marketing', value: 45000, color: '#10B981' },
  { name: 'Others', value: 25000, color: '#F59E0B' },
];

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      name: 'Total Revenue',
      value: '₹4,86,000',
      change: '+12.5%',
      changeType: 'increase',
      icon: BanknotesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total Expenses',
      value: '₹3,14,000',
      change: '+2.1%',
      changeType: 'increase',
      icon: DocumentTextIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Net Profit',
      value: '₹1,72,000',
      change: '+28.4%',
      changeType: 'increase',
      icon: ArrowUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Pending Payments',
      value: '₹89,500',
      change: '-5.2%',
      changeType: 'decrease',
      icon: DocumentTextIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
  ];

  const quickStats = [
    { name: 'Active Customers', value: '142', icon: UsersIcon },
    { name: 'Products in Stock', value: '89', icon: CubeIcon },
    { name: 'Pending Orders', value: '23', icon: DocumentTextIcon },
    { name: 'Low Stock Items', value: '7', icon: CubeIcon },
  ];

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className={`ml-2 flex items-center text-sm ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'increase' ? (
                      <ArrowUpIcon className="w-4 h-4 mr-1" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <stat.icon className="w-8 h-8 text-gray-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales vs Purchases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
              <Bar dataKey="sales" fill="#8B5CF6" name="Sales" />
              <Bar dataKey="purchases" fill="#3B82F6" name="Purchases" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {expenseData.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'Created invoice INV-2025-001', time: '2 hours ago', user: 'Accountant' },
            { action: 'Received payment from Nimesh Pathak', time: '4 hours ago', user: 'System' },
            { action: 'Added new product: Executive Chair', time: '1 day ago', user: 'Admin' },
            { action: 'Updated vendor: Azure Furniture', time: '2 days ago', user: 'Accountant' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-600">by {activity.user}</p>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}