import Card from '../../components/UI/Card';

interface PartnerLine { partner: string; debit: number; credit: number; balance: number; }
const rows: PartnerLine[] = [
  { partner: 'Azure Interior', debit: 56000, credit: 42000, balance: 14000 },
  { partner: 'Modern Office', debit: 120000, credit: 80000, balance: 40000 },
];

export default function PartnerLedger() {
  const totals = rows.reduce((acc, r) => ({
    debit: acc.debit + r.debit,
    credit: acc.credit + r.credit,
    balance: acc.balance + r.balance
  }), { debit: 0, credit: 0, balance: 0 });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Partner Ledger (Mock)</h1>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium">Partner</th>
              <th className="text-right px-3 py-2 font-medium">Debit</th>
              <th className="text-right px-3 py-2 font-medium">Credit</th>
              <th className="text-right px-3 py-2 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.partner}>
                <td className="px-3 py-2">{r.partner}</td>
                <td className="px-3 py-2 text-right">₹{r.debit.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">₹{r.credit.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-medium">₹{r.balance.toLocaleString()}</td>
              </tr>
            ))}
            <tr>
              <td className="px-3 py-2 font-semibold">Total</td>
              <td className="px-3 py-2 text-right font-semibold">₹{totals.debit.toLocaleString()}</td>
              <td className="px-3 py-2 text-right font-semibold">₹{totals.credit.toLocaleString()}</td>
              <td className="px-3 py-2 text-right font-semibold">₹{totals.balance.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
