import { useMemo } from 'react';
import Card from '../../components/UI/Card';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import { Link } from 'react-router-dom';
import { usePurchase } from '../../contexts/PurchaseContext';

interface Row { id: string; number: string; bill: string; partner: string; amount: number; method: string; status: string; }

export default function PaymentList() {
  const { billPayments } = usePurchase();
  const rows: Row[] = useMemo(() => billPayments.map(p => ({
    id: p.id,
    number: p.number,
    bill: p.billId,
    partner: p.partner,
    amount: p.amount,
    method: p.method,
    status: p.status
  })), [billPayments]);

  const columns = [
    { key: 'number', label: 'Payment No' },
    { key: 'bill', label: 'Bill Id' },
    { key: 'partner', label: 'Partner' },
    { key: 'amount', label: 'Amount', render: (v: number) => `₹${v.toLocaleString()}` },
    { key: 'method', label: 'Method', render: (v: string) => v.toUpperCase() },
    { key: 'status', label: 'Status', render: (v: string) => <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${v==='draft'?'bg-gray-100 text-gray-700':v==='posted'?'bg-brand-100 text-brand-700':'bg-red-100 text-red-700'}`}>{v}</span> },
    { key: 'actions', label: 'Actions', render: (_: any, r: Row) => <Link to={`/payments/${r.id}`} className="text-brand-600 hover:text-brand-500 text-sm">Open</Link> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <span className="text-sm text-gray-500">(Created from Vendor Bills)</span>
      </div>
      <Card>
        <Table columns={columns} data={rows} />
        {rows.length === 0 && <div className="text-sm text-gray-500 p-4">No payments yet. Confirm a bill then click Pay Bill to create one.</div>}
      </Card>
    </div>
  );
}
