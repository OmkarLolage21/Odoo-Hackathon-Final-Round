import React, { useMemo } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { usePurchase } from '../../contexts/PurchaseContext';

interface BillRow { id: string; number: string; po: string; vendor: string; date: string; total: number; status: 'draft' | 'posted' | 'paid' | 'cancelled'; }

export default function VendorBillList() {
  const { vendorBills, computeTotals } = usePurchase();
  const rows: BillRow[] = useMemo(() => vendorBills.map(b => {
    const totals = computeTotals(b.lines);
    return { id: b.id, number: b.number, po: b.poId ? b.poId : '-', vendor: b.vendor, date: b.date, total: totals.total, status: b.status };
  }), [vendorBills, computeTotals]);
  const columns = [
    { key: 'number', label: 'Bill No' },
    { key: 'po', label: 'PO Ref' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'date', label: 'Bill Date' },
    { key: 'total', label: 'Total', render: (v: number) => `₹${v.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
        v === 'draft' ? 'bg-gray-100 text-gray-700' : v === 'posted' ? 'bg-brand-100 text-brand-700' : 'bg-green-100 text-green-700'}`}>{v}</span>
    )},
    { key: 'actions', label: 'Actions', render: (_: any, r: BillRow) => <Link to={`/vendor-bills/${r.id}/edit`} className="text-brand-600 hover:text-brand-500 text-sm">Open</Link> }
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vendor Bills</h1>
        <Link to="/vendor-bills/new"><Button size="sm"><PlusIcon className="w-5 h-5 mr-2" />New</Button></Link>
      </div>
      <Card>
        <Table columns={columns} data={rows} />
      </Card>
    </div>
  );
}
