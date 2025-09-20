import Card from '../../components/UI/Card';

export default function ProfitLoss() {
  const data = [
    { label: 'Revenue', amount: 560000 },
    { label: 'COGS', amount: -210000 },
    { label: 'Gross Profit', amount: 350000 },
    { label: 'Operating Expenses', amount: -120000 },
    { label: 'Net Profit', amount: 230000 }
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profit & Loss (Mock)</h1>
      <Card>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {data.map(r => (
              <tr key={r.label}>
                <td className="py-2 px-3 font-medium">{r.label}</td>
                <td className={`py-2 px-3 text-right ${r.amount < 0 ? 'text-red-600' : 'text-gray-900'} font-semibold`}>{r.amount < 0 ? '-' : ''}₹{Math.abs(r.amount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
