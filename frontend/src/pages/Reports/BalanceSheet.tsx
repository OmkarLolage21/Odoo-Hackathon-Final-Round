import React, { useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { CalendarIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BalanceSheetItem {
  name: string;
  amount: number;
  children?: BalanceSheetItem[];
}

const assetsData: BalanceSheetItem[] = [
  {
    name: 'Current Assets',
    amount: 1250000,
    children: [
      { name: 'Cash', amount: 150000 },
      { name: 'Bank', amount: 350000 },
      { name: 'Accounts Receivable', amount: 450000 },
      { name: 'Inventory', amount: 300000 },
    ]
  },
  {
    name: 'Fixed Assets',
    amount: 800000,
    children: [
      { name: 'Furniture & Fixtures', amount: 500000 },
      { name: 'Office Equipment', amount: 200000 },
      { name: 'Vehicles', amount: 100000 },
    ]
  }
];

const liabilitiesData: BalanceSheetItem[] = [
  {
    name: 'Current Liabilities',
    amount: 650000,
    children: [
      { name: 'Accounts Payable', amount: 350000 },
      { name: 'Short-term Loans', amount: 200000 },
      { name: 'Accrued Expenses', amount: 100000 },
    ]
  },
  {
    name: 'Long-term Liabilities',
    amount: 400000,
    children: [
      { name: 'Long-term Loans', amount: 300000 },
      { name: 'Deferred Tax', amount: 100000 },
    ]
  }
];

const equityData: BalanceSheetItem[] = [
  {
    name: 'Owner\'s Equity',
    amount: 1000000,
    children: [
      { name: 'Share Capital', amount: 500000 },
      { name: 'Retained Earnings', amount: 500000 },
    ]
  }
];

export default function BalanceSheet() {
  const [selectedDate, setSelectedDate] = useState('2025-01-31');

  const totalAssets = assetsData.reduce((sum, asset) => sum + asset.amount, 0);
  const totalLiabilities = liabilitiesData.reduce((sum, liability) => sum + liability.amount, 0);
  const totalEquity = equityData.reduce((sum, equity) => sum + equity.amount, 0);

  const renderBalanceSheetSection = (title: string, data: BalanceSheetItem[], total: number) => (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
        {title}
      </h3>
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between items-center font-medium">
            <span>{item.name}</span>
            <span>₹{item.amount.toLocaleString()}</span>
          </div>
          {item.children && (
            <div className="ml-4 space-y-1">
              {item.children.map((child) => (
                <div key={child.name} className="flex justify-between items-center text-gray-600">
                  <span>{child.name}</span>
                  <span>₹{child.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-between items-center font-bold text-lg border-t border-gray-300 pt-2">
        <span>Total {title}</span>
        <span>₹{total.toLocaleString()}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balance Sheet</h1>
          <p className="text-gray-600">Financial position as of {new Date(selectedDate).toLocaleDateString()}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <Button variant="secondary" size="sm">
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary" size="sm">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Company Header */}
      <Card>
        <div className="text-center border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Shiv Furniture</h2>
          <h3 className="text-xl font-semibold text-gray-700">Balance Sheet</h3>
          <p className="text-gray-600">As of {new Date(selectedDate).toLocaleDateString()}</p>
        </div>
      </Card>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <Card>
          {renderBalanceSheetSection('Assets', assetsData, totalAssets)}
        </Card>

        {/* Liabilities & Equity */}
        <Card>
          <div className="space-y-6">
            {renderBalanceSheetSection('Liabilities', liabilitiesData, totalLiabilities)}
            {renderBalanceSheetSection('Equity', equityData, totalEquity)}
            
            <div className="flex justify-between items-center font-bold text-lg border-t-2 border-gray-400 pt-4">
              <span>Total Liabilities & Equity</span>
              <span>₹{(totalLiabilities + totalEquity).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Verification */}
      <Card>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Balance Sheet Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Assets</p>
              <p className="text-xl font-bold text-blue-600">₹{totalAssets.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Liabilities & Equity</p>
              <p className="text-xl font-bold text-green-600">₹{(totalLiabilities + totalEquity).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg ${totalAssets === (totalLiabilities + totalEquity) ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-xl font-bold ${totalAssets === (totalLiabilities + totalEquity) ? 'text-green-600' : 'text-red-600'}`}>
                {totalAssets === (totalLiabilities + totalEquity) ? 'Balanced ✓' : 'Unbalanced ✗'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}