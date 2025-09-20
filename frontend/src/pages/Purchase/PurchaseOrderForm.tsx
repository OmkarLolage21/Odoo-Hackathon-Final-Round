import { useState } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import ActionBar from '../../components/UI/ActionBar';
import { useNavigate, useParams } from 'react-router-dom';

interface LineItem { id: string; product: string; qty: number; price: number; tax: number; }

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [lines, setLines] = useState<LineItem[]>([
    { id: '1', product: 'Office Chair', qty: 2, price: 3500, tax: 18 },
  ]);

  const addLine = () => setLines(prev => [...prev, { id: Date.now().toString(), product: '', qty: 1, price: 0, tax: 18 }]);

  const total = lines.reduce((s,l)=> s + l.qty * l.price * (1 + l.tax/100), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{isEdit ? 'Edit' : 'New'} Purchase Order</h1>
  <ActionBar onNew={()=>navigate('/purchase-orders/new')} onConfirm={()=>navigate('/purchase-orders')} onBack={()=>navigate('/purchase-orders')} onArchiveChange={()=>{}} />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Input label="PO Number" value={isEdit ? 'PO/2025/0001' : 'Auto'} readOnly />
          <Input label="Vendor" value="Azure Interior" readOnly />
          <Input label="PO Date" type="date" defaultValue={new Date().toISOString().slice(0,10)} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Product</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Price</th>
                <th className="py-2 text-right">Tax %</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.id} className="border-b last:border-none">
                  <td className="py-2 pr-2"><input className="w-full border rounded px-2 py-1" value={line.product} onChange={e=>setLines(ls=>ls.map(l=> l.id===line.id?{...l,product:e.target.value}:l))} /></td>
                  <td className="py-2 text-right"><input type="number" className="w-20 border rounded px-2 py-1 text-right" value={line.qty} onChange={e=>setLines(ls=>ls.map(l=> l.id===line.id?{...l,qty:Number(e.target.value)}:l))} /></td>
                  <td className="py-2 text-right"><input type="number" className="w-24 border rounded px-2 py-1 text-right" value={line.price} onChange={e=>setLines(ls=>ls.map(l=> l.id===line.id?{...l,price:Number(e.target.value)}:l))} /></td>
                  <td className="py-2 text-right"><input type="number" className="w-16 border rounded px-2 py-1 text-right" value={line.tax} onChange={e=>setLines(ls=>ls.map(l=> l.id===line.id?{...l,tax:Number(e.target.value)}:l))} /></td>
                  <td className="py-2 text-right font-medium">₹{(line.qty*line.price*(1+line.tax/100)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between items-center">
            <Button size="sm" variant="secondary" type="button" onClick={addLine}>Add Line</Button>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-lg font-bold">₹{total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
