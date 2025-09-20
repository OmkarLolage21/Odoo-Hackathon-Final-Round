import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

interface PortalInvoice { id: string; number: string; date: string; due: string; amount: number; status: 'open' | 'paid'; }
const invoices: PortalInvoice[] = [
  { id: '1', number: 'INV/2025/0005', date: '2025-09-10', due: '2025-09-25', amount: 12500, status: 'open' },
  { id: '2', number: 'INV/2025/0004', date: '2025-09-01', due: '2025-09-15', amount: 8900, status: 'paid' }
];

export default function MyInvoices() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium">Invoice</th>
              <th className="text-left px-3 py-2 font-medium">Date</th>
              <th className="text-left px-3 py-2 font-medium">Due</th>
              <th className="text-right px-3 py-2 font-medium">Amount</th>
              <th className="text-right px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="px-3 py-2">{inv.number}</td>
                <td className="px-3 py-2">{inv.date}</td>
                <td className="px-3 py-2">{inv.due}</td>
                <td className="px-3 py-2 text-right">₹{inv.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-brand-100 text-brand-700'}`}>{inv.status}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  {inv.status === 'open' && <Button size="sm" variant="secondary">Pay Now</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
