import { useState } from 'react';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import ActionBar from '../../components/UI/ActionBar';
import { useNavigate, useParams } from 'react-router-dom';

interface Line { id: string; product: string; qty: number; price: number; }

export default function CustomerInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [customer, setCustomer] = useState('');
  const [lines, setLines] = useState<Line[]>([{ id: '1', product: '', qty: 1, price: 0 }]);

  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines(ls => ls.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  const addLine = () => setLines(ls => [...ls, { id: String(ls.length + 1), product: '', qty: 1, price: 0 }]);

  return (
    <div className="space-y-6">
  <ActionBar onBack={() => navigate(-1)} onNew={() => navigate('/customer-invoices/new')} onConfirm={() => {/* placeholder */}} onArchiveChange={()=>{}} />
      <Card>
        <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Customer Invoice</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Select customer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <Input type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input type="date" />
          </div>
        </div>
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-medium">Product</th>
                <th className="text-left px-3 py-2 font-medium">Qty</th>
                <th className="text-left px-3 py-2 font-medium">Unit Price</th>
                <th className="text-right px-3 py-2 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map(line => (
                <tr key={line.id}>
                  <td className="px-3 py-2 w-1/2">
                    <Input value={line.product} onChange={e => updateLine(line.id, { product: e.target.value })} placeholder="Product name" />
                  </td>
                  <td className="px-3 py-2 w-24">
                    <Input type="number" value={line.qty} onChange={e => updateLine(line.id, { qty: Number(e.target.value) })} />
                  </td>
                  <td className="px-3 py-2 w-36">
                    <Input type="number" value={line.price} onChange={e => updateLine(line.id, { price: Number(e.target.value) })} />
                  </td>
                  <td className="px-3 py-2 text-right w-32">₹{(line.qty * line.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={addLine}>Add Line</Button>
          </div>
        </div>
        <div className="flex justify-end items-center gap-6">
          <div className="text-lg font-semibold">Total: ₹{total.toFixed(2)}</div>
          <Button>Save</Button>
        </div>
      </Card>
    </div>
  );
}
