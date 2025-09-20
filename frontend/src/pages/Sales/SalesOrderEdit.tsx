import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Table from '../../components/UI/Table';
import Input from '../../components/UI/Input';
import { SalesOrderLineInput, SalesOrderResponse } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import salesOrderService from '../../services/salesOrderService';
import productService from '../../services/productService';

interface EditableLine extends SalesOrderLineInput { id?: string; product_id?: string | null; tax_percent?: number; temp_id?: string; }

export default function SalesOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin';
  const [order, setOrder] = useState<SalesOrderResponse | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [newLine, setNewLine] = useState<EditableLine>({ temp_id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, product_id: null, tax_percent: 0 });

  const load = useCallback(async () => {
    if (!id || !role) return;
    setLoading(true);
    setError(null);
    try {
      const [so, prods] = await Promise.all([
        salesOrderService.get(id, role),
        productService.list(role)
      ]);
      setOrder(so);
      setLines(so.lines.map(l => ({ id: l.id, product_name: l.product_name, quantity: l.quantity, unit_price: l.unit_price })));
      setProducts(prods);
    } catch (e: any) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id, role]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!newLine.product_id) return;
    const p = products.find(p => p.id === newLine.product_id);
    if (p) {
      setNewLine(n => ({ ...n, product_name: p.name, unit_price: p.salesPrice, tax_percent: p.salesTaxPercent ?? 0 }));
    }
  }, [newLine.product_id, products]);

  const addLine = () => {
    if (!newLine.product_id || !newLine.product_name) return;
    setLines(prev => [...prev, newLine]);
    setNewLine({ temp_id: crypto.randomUUID(), product_name: '', quantity: 1, unit_price: 0, product_id: null, tax_percent: 0 });
  };

  const removeLine = (idx: number) => {
    setLines(l => l.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!id || !role) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { lines: lines.map(l => ({ product_name: l.product_name, quantity: l.quantity, unit_price: l.unit_price })), status: order?.status };
      const updated = await salesOrderService.update(id, payload, role);
      setOrder(updated);
      // lines replaced by backend; reload
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!id || !role) return;
    if (!confirm('Delete this Sales Order? This cannot be undone.')) return;
    try {
      await salesOrderService.delete(id, role);
      navigate('/sales-orders');
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  };

  const columns = [
    { key: 'idx', label: '#' },
    { key: 'product_name', label: 'Product' },
    { key: 'quantity', label: 'Qty' },
    { key: 'unit_price', label: 'Unit Price' },
    { key: 'untaxed_amount', label: 'Untaxed' },
    { key: 'tax_percent', label: 'Tax %' },
    { key: 'tax_amount', label: 'Tax Amt' },
    { key: 'total_amount', label: 'Total' },
    ...(isAdmin ? [{ key: 'row_actions', label: '', render: (_: any, r: any) => (
      <button onClick={() => removeLine(r.idx - 1)} className="text-xs text-red-600 hover:underline">Remove</button>
    )}] : [])
  ];

  const displayLines = (order ? order.lines : lines.map(l => ({
    id: l.id || l.temp_id,
    product_name: l.product_name,
    quantity: l.quantity,
    unit_price: l.unit_price,
    untaxed_amount: l.quantity * l.unit_price,
    tax_percent: l.tax_percent ?? 0,
    tax_amount: (l.quantity * l.unit_price) * ((l.tax_percent ?? 0)/100),
    total_amount: (l.quantity * l.unit_price) * (1 + (l.tax_percent ?? 0)/100),
  }))).map((l, idx) => ({ ...l, idx: idx + 1 }));

  const totals = displayLines.reduce((acc, l: any) => {
    acc.untaxed += Number(l.untaxed_amount) || 0;
    acc.tax += Number(l.tax_amount) || 0;
    acc.total += Number(l.total_amount) || 0;
    return acc;
  }, { untaxed: 0, tax: 0, total: 0 });

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!order) return <div className="p-6">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Sales Order</h1>
        <div className="flex space-x-2">
          {isAdmin && <Button variant="danger" onClick={doDelete}>Delete</Button>}
          {isAdmin && <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>}
        </div>
      </div>

      <Card>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600">SO Number</label>
            <Input value={order.so_number} disabled />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">Status</label>
            <Input value={order.status} disabled />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">Created</label>
            <Input value={new Date(order.created_at).toLocaleString()} disabled />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">Updated</label>
            <Input value={new Date(order.updated_at).toLocaleString()} disabled />
          </div>
        </div>
      </Card>

      {isAdmin && (
        <Card>
          <div className="grid md:grid-cols-6 gap-4 items-end">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600">Product</label>
              <select
                aria-label="Product select"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newLine.product_id || ''}
                onChange={e=>setNewLine(n=>({...n, product_id: e.target.value || null}))}
              >
                <option value="">Select product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Qty</label>
              <Input type="number" value={newLine.quantity} onChange={e=>setNewLine(n=>({...n, quantity: Number(e.target.value)}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Unit Price</label>
              <Input type="number" value={newLine.unit_price} onChange={e=>setNewLine(n=>({...n, unit_price: Number(e.target.value)}))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">Tax %</label>
              <Input type="number" value={newLine.tax_percent ?? 0} disabled />
            </div>
            <div className="flex items-center pt-5">
              <Button type="button" onClick={addLine}>Add Line</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Table columns={columns as any} data={displayLines as any} isLoading={false} />
        <div className="flex justify-end mt-4 space-x-8 text-sm font-semibold">
          <div>Untaxed: {totals.untaxed.toFixed(2)}</div>
          <div>Tax: {totals.tax.toFixed(2)}</div>
          <div>Total: {totals.total.toFixed(2)}</div>
        </div>
      </Card>
    </div>
  );
}
