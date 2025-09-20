import Card from '../../components/UI/Card';

export default function StockReport() {
  const items = [
    { sku: 'PROD-001', name: 'Laptop', qty: 42, value: 840000 },
    { sku: 'PROD-002', name: 'Mouse', qty: 310, value: 62000 },
    { sku: 'PROD-003', name: 'Keyboard', qty: 150, value: 150000 }
  ];
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Stock Valuation (Mock)</h1>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-3 py-2 font-medium">SKU</th>
              <th className="text-left px-3 py-2 font-medium">Product</th>
              <th className="text-right px-3 py-2 font-medium">Qty</th>
              <th className="text-right px-3 py-2 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(i => (
              <tr key={i.sku}>
                <td className="px-3 py-2">{i.sku}</td>
                <td className="px-3 py-2">{i.name}</td>
                <td className="px-3 py-2 text-right">{i.qty}</td>
                <td className="px-3 py-2 text-right">₹{i.value.toLocaleString()}</td>
              </tr>
            ))}
            <tr>
              <td className="px-3 py-2 font-semibold" colSpan={3}>Total</td>
              <td className="px-3 py-2 text-right font-semibold">₹{total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
